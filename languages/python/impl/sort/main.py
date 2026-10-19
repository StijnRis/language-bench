from array import array


def setup(args):
    pass


def decode(data):
    a = array("i")
    a.frombytes(data)
    return a.tolist()


def solve(a):
    a.sort()  # list.sort on plain ints: timsort, the idiomatic fast path
    return a


def emit(a):
    return a
