import math
from array import array


def setup(args):
    pass


def decode(data):
    n = int.from_bytes(data[:4], "little")
    flat = array("d")
    flat.frombytes(data[4 : 4 + 16 * n * n])
    vals = flat.tolist()
    a = [vals[i * n : (i + 1) * n] for i in range(n)]
    b = [vals[n * n + i * n : n * n + (i + 1) * n] for i in range(n)]
    return n, a, b


def solve(inst):
    n, a, b = inst
    c = [[0.0] * n for _ in range(n)]
    for i in range(n):
        ci = c[i]
        ai = a[i]
        for k in range(n):
            aik = ai[k]
            bk = b[k]
            for j in range(n):
                ci[j] += aik * bk[j]
    return c


def emit(c):
    return [math.floor(v + 0.5) for row in c for v in row]
