import sys

n = int(sys.argv[1])
# bytearray slice assignment is the idiomatic fast path for a sieve in CPython
s = bytearray([1]) * (n + 1)
s[0] = s[1] = 0
p = 2
while p * p <= n:
    if s[p]:
        s[p * p :: p] = bytes(len(range(p * p, n + 1, p)))
    p += 1
primes = [i for i in range(2, n + 1) if s[i]]
print("count=%d" % len(primes))
print("last=%d" % primes[-1])
print("sum=%d" % sum(primes))
