from array import array


def setup(args):
    pass


def decode(data):
    a = array("i")
    a.frombytes(data)
    n = len(a) // 2
    items = a.tolist()
    return items[:n], items[n:]


def solve(inst):
    keys, lookups = inst
    m = {}
    get = m.get
    for k in keys:
        m[k] = get(k, 0) + 1
    checksum = 0
    for k, c in m.items():
        checksum += k * c
    hits = 0
    for k in lookups:
        hits += get(k, 0)
    return len(m), checksum, hits


def emit(res):
    return res
