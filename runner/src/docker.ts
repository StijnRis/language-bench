import { spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CACHE, HYPERFINE_VERSION, ROOT } from "./config";

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
  ms: number;
}

/** A long-lived container: repo mounted read-only at /repo, scratch dir at /work, hyperfine in PATH. */
export class Container {
  constructor(
    readonly name: string,
    readonly image: string,
  ) {}

  static start(name: string, image: string, workDir: string, log = console.error): Container {
    fs.mkdirSync(workDir, { recursive: true });
    log(`[docker] starting ${image} as ${name}`);
    spawnSync("docker", ["rm", "-f", name], { stdio: "ignore" });
    const r = spawnSync(
      "docker",
      ["run", "-d", "--name", name, "-v", `${ROOT}:/repo:ro`, "-v", `${workDir}:/work`, image, "sleep", "infinity"],
      { encoding: "utf8" },
    );
    if (r.status !== 0) throw new Error(`docker run failed: ${r.stderr}`);
    const c = new Container(name, image);
    c.installHyperfine();
    return c;
  }

  private installHyperfine() {
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
  }

  exec(cmd: string, opts: { timeoutMs?: number } = {}): ExecResult {
    const t0 = performance.now();
    const r = spawnSync("docker", ["exec", this.name, "sh", "-c", cmd], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      timeout: opts.timeoutMs,
    });
    return {
      code: r.status ?? -1,
      stdout: r.stdout ?? "",
      stderr: r.stderr ?? "",
      ms: performance.now() - t0,
    };
  }

  imageDigest(): string | undefined {
    const r = spawnSync("docker", ["image", "inspect", "--format", "{{index .RepoDigests 0}}", this.image], {
      encoding: "utf8",
    });
    return r.status === 0 ? r.stdout.trim() : undefined;
  }

  stop() {
    spawnSync("docker", ["rm", "-f", this.name], { stdio: "ignore" });
  }
}
