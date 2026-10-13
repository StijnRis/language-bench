static bool IsPrime(long n)
{
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 == 0) return false;
    for (long d = 3; d * d <= n; d += 2)
        if (n % d == 0) return false;
    return true;
}

long n = long.Parse(args[0]);
int workers = int.Parse(args[1]);
var counts = new long[workers];
var threads = new Thread[workers];
for (int t = 0; t < workers; t++)
{
    int id = t;
    threads[t] = new Thread(() =>
    {
        long c = 0;
        for (long i = id; i < n; i += workers)
            if (IsPrime(i)) c++;
        counts[id] = c;
    });
    threads[t].Start();
}

long total = 0;
for (int t = 0; t < workers; t++)
{
    threads[t].Join();
    total += counts[t];
}

Console.WriteLine($"primes={total}");
