N = 10000000


def setup(args):
    global N
    if args:
        N = int(args[0])


def decode(data):
    return None


def solve(_):
    n = N
    # bytearray slice assignment is the idiomatic fast path for a sieve in CPython
    s = bytearray([1]) * (n + 1)
    s[0] = s[1] = 0
    p = 2
    while p * p <= n:
        if s[p]:
            s[p * p :: p] = bytes(len(range(p * p, n + 1, p)))
        p += 1
    primes = [i for i in range(2, n + 1) if s[i]]
    return len(primes), primes[-1], sum(primes)


def emit(res):
    return res
