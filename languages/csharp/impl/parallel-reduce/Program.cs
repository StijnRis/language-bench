public static class Problem
{
    static long nArg = 2000000;
    static int workersArg = 4;

    static bool IsPrime(long n)
    {
        if (n < 2) return false;
        if (n < 4) return true;
        if (n % 2 == 0) return false;
        for (long d = 3; d * d <= n; d += 2)
            if (n % d == 0) return false;
        return true;
    }

    public static void Setup(string[] args)
    {
        if (args.Length > 1) { nArg = long.Parse(args[0]); workersArg = int.Parse(args[1]); }
    }

    public static object Decode(byte[] data) => null;

    public static object Solve(object inst)
    {
        long n = nArg;
        int workers = workersArg;
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
        return new long[] { total };
    }

    public static void Emit(object res, Action<long> sink)
    {
        sink(((long[])res)[0]);
    }

    public static void Release(object inst, object res) { }
}
