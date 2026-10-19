import { execFileSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CACHE, HYPERFINE_VERSION, ROOT } from "./config";
import { ensureTools, toolPath } from "./tools";

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
  ms: number;
  timedOut?: boolean;
}

export interface ExecOptions {
  /** hard wall-clock limit; the process is killed inside the container (needs `timeout`, falls back to the host-side limit) */
  timeoutSeconds?: number;
  env?: Record<string, string>;
}

const q = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/**
 * A long-lived container: repo mounted read-only at /repo, scratch dir at /work, tmpfs at /dev/shm,
 * hyperfine and lbgen in /usr/local/bin. `LB_LOCAL=1` runs everything directly on the host instead
 * (development and tests: no Docker, same commands, paths /repo and /work mapped to the checkout).
 */
export interface Container {
  readonly name: string;
  readonly image: string;
  exec(cmd: string, opts?: ExecOptions): ExecResult;
  /** `lbgen <genArgs> | <cmd>` with the generator's output on the command's standard input (a plain pipe, no buffering in between) */
  pipeline(genArgs: string[], cmd: string, opts?: ExecOptions): Promise<ExecResult>;
  /** host path of the cgroup memory.stat of this container, if it can be found */
  memoryStatPath(): string | undefined;
  imageDigest(): string | undefined;
  /** path of a file under /work as seen by the host */
  hostWorkPath(rel: string): string;
  hasHyperfine: boolean;
  stop(): void;
}

function withEnv(cmd: string, env?: Record<string, string>) {
  if (!env) return cmd;
  const pairs = Object.entries(env).map(([k, v]) => `${k}=${q(v)}`);
  return pairs.length ? `${pairs.join(" ")} ${cmd}` : cmd;
}

/* ------------------------------------------------------------------ docker */

export class DockerContainer implements Container {
  hasHyperfine = true;
  constructor(
    readonly name: string,
    readonly image: string,
    private workDir: string,
  ) {}

  static start(name: string, image: string, workDir: string, log = console.error): DockerContainer {
    fs.mkdirSync(workDir, { recursive: true });
    log(`[docker] starting ${image} as ${name}`);
    spawnSync("docker", ["rm", "-f", name], { stdio: "ignore" });
    const r = spawnSync(
      "docker",
      ["run", "-d", "--name", name, "--shm-size=2g", "-v", `${ROOT}:/repo:ro`, "-v", `${workDir}:/work`, image, "sleep", "infinity"],
      { encoding: "utf8" },
    );
    if (r.status !== 0) throw new Error(`docker run failed: ${r.stderr}`);
    const c = new DockerContainer(name, image, workDir);
    c.installTools();
    return c;
  }

  private installTools() {
    const arch = this.exec("uname -m").stdout.trim();
    const triple = arch === "aarch64" ? "aarch64-unknown-linux-musl" : "x86_64-unknown-linux-musl";
    const dir = path.join(CACHE, `hyperfine-${HYPERFINE_VERSION}-${triple}`);
    const bin = path.join(dir, "hyperfine");
    if (!fs.existsSync(bin)) {
      fs.mkdirSync(dir, { recursive: true });
      const url = `https://github.com/sharkdp/hyperfine/releases/download/v${HYPERFINE_VERSION}/hyperfine-v${HYPERFINE_VERSION}-${triple}.tar.gz`;
      execFileSync("curl", ["-fsSL", "-o", "hf.tar.gz", url], { cwd: dir });
      execFileSync("tar", ["-xzf", "hf.tar.gz", "--strip-components=1"], { cwd: dir });
      fs.chmodSync(bin, 0o755);
    }
    execFileSync("docker", ["cp", bin, `${this.name}:/usr/local/bin/hyperfine`]);
    // the static generator: file-processing runs it inside the container, before every iteration
    ensureTools();
    execFileSync("docker", ["cp", toolPath("lbgen-static"), `${this.name}:/usr/local/bin/lbgen`]);
  }

  private wrap(cmd: string, opts: ExecOptions = {}) {
    const full = withEnv(cmd, opts.env);
    const t = opts.timeoutSeconds;
    const script = t
      ? `if command -v timeout >/dev/null 2>&1; then exec timeout -k 5 ${Math.ceil(t)} sh -c "$LB_CMD"; else exec sh -c "$LB_CMD"; fi`
      : `exec sh -c "$LB_CMD"`;
    return { full, script };
  }

  exec(cmd: string, opts: ExecOptions = {}): ExecResult {
    const { full, script } = this.wrap(cmd, opts);
    const t0 = performance.now();
    const hostLimit = opts.timeoutSeconds ? (opts.timeoutSeconds + 30) * 1000 : undefined;
    const r = spawnSync("docker", ["exec", "-e", `LB_CMD=${full}`, this.name, "sh", "-c", script], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      timeout: hostLimit,
    });
    return { code: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "", ms: performance.now() - t0, timedOut: r.status === 124 || r.status === 137 || r.error?.message.includes("ETIMEDOUT") };
  }

  pipeline(genArgs: string[], cmd: string, opts: ExecOptions = {}): Promise<ExecResult> {
    const { full, script } = this.wrap(cmd, opts);
    const gen = [toolPath("lbgen"), ...genArgs].map(q).join(" ");
    const pipe = `${gen} | docker exec -i -e ${q(`LB_CMD=${full}`)} ${q(this.name)} sh -c ${q(script)}`;
    return runShell(pipe, opts.timeoutSeconds ? (opts.timeoutSeconds + 30) * 1000 : undefined);
  }

  memoryStatPath(): string | undefined {
    const pid = spawnSync("docker", ["inspect", "-f", "{{.State.Pid}}", this.name], { encoding: "utf8" }).stdout.trim();
    return cgroupMemoryStat(pid);
  }

  imageDigest(): string | undefined {
    const r = spawnSync("docker", ["image", "inspect", "--format", "{{index .RepoDigests 0}}", this.image], { encoding: "utf8" });
    return r.status === 0 ? r.stdout.trim() : undefined;
  }

  hostWorkPath(rel: string) {
    return path.join(this.workDir, rel);
  }

  stop() {
    spawnSync("docker", ["rm", "-f", this.name], { stdio: "ignore" });
  }
}

/** memory.stat of the cgroup a process lives in (v2 unified hierarchy first, then the v1 memory controller). */
export function cgroupMemoryStat(pid: string | number): string | undefined {
  let text: string;
  try {
    text = fs.readFileSync(`/proc/${pid}/cgroup`, "utf8");
  } catch {
    return undefined;
  }
  for (const line of text.split("\n")) {
    const [, controllers, p] = line.split(":");
    if (p === undefined) continue;
    const candidates = !controllers ? [`/sys/fs/cgroup${p}/memory.stat`] : controllers.split(",").includes("memory") ? [`/sys/fs/cgroup/memory${p}/memory.stat`] : [];
    for (const c of candidates) if (fs.existsSync(c)) return c;
  }
  return undefined;
}

function runShell(script: string, hostLimitMs?: number): Promise<ExecResult> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const p = spawn("sh", ["-c", script], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "", timedOut = false;
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => (stderr += d.toString().slice(0, 4000)));
    const timer = hostLimitMs ? setTimeout(() => { timedOut = true; p.kill("SIGKILL"); }, hostLimitMs) : undefined;
    p.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr, ms: performance.now() - t0, timedOut: timedOut || code === 124 || code === 137 });
    });
  });
}

/* ------------------------------------------------------------------ local */

export class LocalContainer implements Container {
  hasHyperfine = spawnSync("hyperfine", ["--version"]).status === 0;
  readonly image = "local";
  constructor(
    readonly name: string,
    private workDir: string,
  ) {
    ensureTools();
    fs.mkdirSync(path.join(workDir, "bin"), { recursive: true });
  }

  /** the commands name /repo, /work and /usr/local/bin/lbgen; run them against the checkout instead */
  private map(cmd: string) {
    return cmd
      .replace(/\/usr\/local\/bin\/lbgen/g, toolPath("lbgen"))
      .replace(/(^|[\s'"=])\/repo(?=\/|$|[\s'"])/g, `$1${ROOT}`)
      .replace(/(^|[\s'"=])\/work(?=\/|$|[\s'"])/g, `$1${this.workDir}`);
  }

  exec(cmd: string, opts: ExecOptions = {}): ExecResult {
    const t0 = performance.now();
    const r = spawnSync("sh", ["-c", withEnv(this.map(cmd), opts.env)], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      timeout: opts.timeoutSeconds ? opts.timeoutSeconds * 1000 : undefined,
      cwd: this.workDir,
      env: { ...process.env, LB_GEN: toolPath("lbgen") },
    });
    return { code: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "", ms: performance.now() - t0, timedOut: r.signal === "SIGTERM" };
  }

  pipeline(genArgs: string[], cmd: string, opts: ExecOptions = {}): Promise<ExecResult> {
    const gen = [toolPath("lbgen"), ...genArgs].map(q).join(" ");
    const t = opts.timeoutSeconds ? `timeout -k 5 ${Math.ceil(opts.timeoutSeconds)} ` : "";
    return runShell(`cd ${q(this.workDir)} && ${gen} | LB_GEN=${q(toolPath("lbgen"))} ${t}sh -c ${q(withEnv(this.map(cmd), opts.env))}`, opts.timeoutSeconds ? (opts.timeoutSeconds + 30) * 1000 : undefined);
  }

  memoryStatPath() {
    return cgroupMemoryStat(process.pid);
  }
  imageDigest() {
    return undefined;
  }
  hostWorkPath(rel: string) {
    return path.join(this.workDir, rel);
  }
  stop() {}
}

export function startContainer(name: string, image: string, workDir: string, log = console.error): Container {
  if (process.env.LB_LOCAL) {
    fs.mkdirSync(workDir, { recursive: true });
    return new LocalContainer(name, workDir);
  }
  return DockerContainer.start(name, image, workDir, log);
}
