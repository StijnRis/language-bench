import sys


def main(n):
    x = 1
    m = {}
    for _ in range(n):
        x = x * 48271 % 2147483647
        k = x % (n // 2)
        m[k] = m.get(k, 0) + 1

    checksum = 0
    for k, c in m.items():
        checksum += k * c

    hits = 0
    for _ in range(n):
        x = x * 48271 % 2147483647
        hits += m.get(x % n, 0)

    print(f"distinct={len(m)}")
    print(f"checksum={checksum}")
    print(f"hits={hits}")


main(int(sys.argv[1]))
