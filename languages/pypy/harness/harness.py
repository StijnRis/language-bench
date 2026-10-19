# language-bench harness for Python: see harness/CONTRACT.md.
# usage: python3 harness.py <problem.py> [problem arguments]
# The problem module provides setup(args), decode(data), solve(instance), emit(result) -> iterable of ints
# (the canonical result words) and optionally release(instance, result).
import importlib.util
import os
import subprocess
import sys
import time

_mono = getattr(time, "monotonic_ns", None) or (lambda: int(time.monotonic() * 1e9))
_wall = getattr(time, "time_ns", None) or (lambda: int(time.time() * 1e9))


def _num(k, d):
    v = os.environ.get(k)
    try:
        return float(v) if v else d
    except ValueError:
        return d


def _read(stream, n):
    chunks = []
    while n:
        c = stream.read(min(n, 1 << 24))
        if not c:
            sys.stderr.write("harness: input ended early\n")
            sys.exit(1)
        chunks.append(c)
        n -= len(c)
    return b"".join(chunks)


def main():
    path = sys.argv[1]
    spec = importlib.util.spec_from_file_location("problem", path)
    problem = importlib.util.module_from_spec(spec)
    sys.modules["problem"] = problem
    spec.loader.exec_module(problem)

    inp = os.environ.get("LB_INPUT", "none")
    budget = _num("LB_BUDGET_SECONDS", 10) * 1e9
    min_iters = int(_num("LB_MIN_ITERS", 3))
    max_iters = int(_num("LB_MAX_ITERS", 0))
    start = int(_num("LB_START", 0))
    gen = os.environ.get("LB_GEN") or "/usr/local/bin/lbgen"
    file = os.environ.get("LB_FILE") or "/dev/shm/lb-input"
    pname = os.environ.get("LB_PROBLEM", "")
    file_ready = "LB_FILE_READY" in os.environ
    release = getattr(problem, "release", None)

    problem.setup(sys.argv[2:])
    stdin = sys.stdin.buffer
    rows = []
    kernel = 0
    mono0, wall0 = _mono(), _wall()
    reason = "budget"
    P1, P2 = 2147483647, 2147483629

    while True:
        if inp == "stream":
            hdr = _read(stdin, 8)
            data = _read(stdin, int.from_bytes(hdr, "little"))
        elif inp == "file":
            if not file_ready:
                if subprocess.call([gen, "file", pname, str(start + len(rows)), file]) != 0:
                    sys.stderr.write("harness: generator failed\n")
                    sys.exit(1)
            data = file.encode()
        else:
            data = b""
        inst = problem.decode(data)
        t0 = _mono()
        res = problem.solve(inst)
        t1 = _mono()
        h1, h2, n = 17, 19, 0
        for w in problem.emit(res):
            h1 = (h1 * 1000003 + w % P1) % P1
            h2 = (h2 * 999983 + w % P2) % P2
            n += 1
        h1 = (h1 * 1000003 + n % P1) % P1
        h2 = (h2 * 999983 + n % P2) % P2
        if release:
            release(inst, res)
        del inst, res
        if inp == "file" and not file_ready:
            try:
                os.remove(file)
            except OSError:
                pass
        rows.append((t0, t1, h1, h2))
        kernel += t1 - t0
        if max_iters and len(rows) >= max_iters:
            reason = "iters"
            break
        if kernel >= budget and len(rows) >= min_iters:
            break

    out = ["LB 1 clock=time.monotonic_ns", "START mono=%d wall=%d" % (mono0, wall0)]
    for i, (t0, t1, h1, h2) in enumerate(rows):
        out.append("ITER %d t0=%d t1=%d check=%d:%d" % (i + 1, t0, t1, h1, h2))
    out.append("DONE iters=%d kernel_ns=%d reason=%s" % (len(rows), kernel, reason))
    sys.stdout.write("\n".join(out) + "\n")
    sys.stdout.flush()


main()
