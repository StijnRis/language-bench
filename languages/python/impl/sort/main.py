import sys


def main(n):
    x = 1
    a = []
    for _ in range(n):
        x = x * 48271 % 2147483647
        a.append(x)

    a.sort()

    checksum = 0
    for i, v in enumerate(a):
        checksum = (checksum + i * v) % 1000000007

    print(f"first={a[0]}")
    print(f"last={a[-1]}")
    print(f"median={a[n // 2]}")
    print(f"checksum={checksum}")


main(int(sys.argv[1]))
