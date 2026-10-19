# N-body simulation, after the Computer Language Benchmarks Game.
import math
import struct

STEPS = 1000000


def setup(args):
    global STEPS
    if args:
        STEPS = int(args[0])


def decode(data):
    v = struct.unpack("<35d", data)
    return [list(v[i * 7 : i * 7 + 7]) for i in range(5)]  # x y z vx vy vz mass


def energy(b):
    e = 0.0
    for i in range(5):
        bi = b[i]
        e += 0.5 * bi[6] * (bi[3] * bi[3] + bi[4] * bi[4] + bi[5] * bi[5])
        for j in range(i + 1, 5):
            bj = b[j]
            dx = bi[0] - bj[0]
            dy = bi[1] - bj[1]
            dz = bi[2] - bj[2]
            e -= bi[6] * bj[6] / math.sqrt(dx * dx + dy * dy + dz * dz)
    return e


def solve(b):
    solar = 4 * math.pi * math.pi
    px = py = pz = 0.0
    for o in b:
        px += o[3] * o[6]
        py += o[4] * o[6]
        pz += o[5] * o[6]
    b[0][3] = -px / solar
    b[0][4] = -py / solar
    b[0][5] = -pz / solar
    e0 = energy(b)
    dt = 0.01
    pairs = [(b[i], b[j]) for i in range(5) for j in range(i + 1, 5)]
    sqrt = math.sqrt
    for _ in range(STEPS):
        for bi, bj in pairs:
            dx = bi[0] - bj[0]
            dy = bi[1] - bj[1]
            dz = bi[2] - bj[2]
            d2 = dx * dx + dy * dy + dz * dz
            mag = dt / (d2 * sqrt(d2))
            bm = bi[6] * mag
            cm = bj[6] * mag
            bi[3] -= dx * cm
            bi[4] -= dy * cm
            bi[5] -= dz * cm
            bj[3] += dx * bm
            bj[4] += dy * bm
            bj[5] += dz * bm
        for o in b:
            o[0] += dt * o[3]
            o[1] += dt * o[4]
            o[2] += dt * o[5]
    return e0, energy(b)


def emit(res):
    return [math.floor(e * 1e9 + 0.5) for e in res]
