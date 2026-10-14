import sys

n = int(sys.argv[1])
a = [[float((i * 31 + j * 17) % 10 + 1) for j in range(n)] for i in range(n)]
b = [[float((i * 13 + j * 7) % 10 - 4) for j in range(n)] for i in range(n)]
c = [[0.0] * n for _ in range(n)]

for i in range(n):
    ci = c[i]
    ai = a[i]
    for k in range(n):
        aik = ai[k]
        bk = b[k]
        for j in range(n):
            ci[j] += aik * bk[j]

trace = 0.0
total = 0.0
for i in range(n):
    trace += c[i][i]
    for v in c[i]:
        total += v
print("trace=%d" % trace)
print("sum=%d" % total)
print("c00=%d" % c[0][0])
print("clast=%d" % c[n - 1][n - 1])
