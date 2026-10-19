import sys
from multiprocessing import Pool


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


if __name__ == "__main__":
    n = int(sys.argv[1])
    workers = int(sys.argv[2])
    with Pool(workers) as pool:
        parts = pool.map(count, [(n, workers, t) for t in range(workers)])
    print(f"primes={sum(parts)}")
