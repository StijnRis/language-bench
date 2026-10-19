import multiprocessing

N, WORKERS = 2000000, 4


def setup(args):
    global N, WORKERS
    if len(args) > 1:
        N, WORKERS = int(args[0]), int(args[1])


def decode(data):
    return None


def is_prime(n):
    if n < 2:
        return False
    if n < 4:
        return True
    if n % 2 == 0:
        return False
    d = 3
    while d * d <= n:
        if n % d == 0:
            return False
        d += 2
    return True


def count(args):
    n, workers, t = args
    return sum(1 for i in range(t, n, workers) if is_prime(i))


def solve(_):
    # processes (the GIL); fork explicitly: the default start method differs between versions and platforms
    with multiprocessing.get_context("fork").Pool(WORKERS) as pool:
        parts = pool.map(count, [(N, WORKERS, t) for t in range(WORKERS)])
    return (sum(parts),)


def emit(res):
    return res
