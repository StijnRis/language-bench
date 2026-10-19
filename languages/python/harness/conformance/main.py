# conformance problem: sum, maximum and a checksum of 4096 int32 values
from array import array


def setup(args):
    pass


def decode(data):
    a = array("i")
    a.frombytes(data)
    return a.tolist()


def solve(a):
    sq = 0
    for v in a:
        sq = (sq + v * v) % 1000003
    return sum(a), max(a), sq, len(a)


def emit(res):
    return res
