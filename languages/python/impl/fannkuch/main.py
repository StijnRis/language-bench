N = 9


def setup(args):
    global N
    if args:
        N = int(args[0])


def decode(data):
    return None


def solve(_):
    n = N
    perm1 = list(range(n))
    count = [0] * n
    maxflips = 0
    permcount = 0
    checksum = 0
    r = n
    while True:
        while r != 1:
            count[r - 1] = r
            r -= 1
        perm = perm1[:]
        flips = 0
        k = perm[0]
        while k:
            perm[: k + 1] = perm[k::-1]
            flips += 1
            k = perm[0]
        if flips > maxflips:
            maxflips = flips
        checksum += flips if permcount % 2 == 0 else -flips
        while True:
            if r == n:
                return checksum, maxflips
            p0 = perm1[0]
            for i in range(r):
                perm1[i] = perm1[i + 1]
            perm1[r] = p0
            count[r] -= 1
            if count[r] > 0:
                break
            r += 1
        permcount += 1


def emit(res):
    return res
