public static class Problem
{
    static int nArg = 10000000;

    public static void Setup(string[] args)
    {
        if (args.Length > 0) nArg = int.Parse(args[0]);
    }

    public static object Decode(byte[] data) => null;

    public static object Solve(object inst)
    {
        int n = nArg;
        var composite = new bool[n + 1];
        for (long p = 2; p * p <= n; p++)
            if (!composite[p])
                for (long m = p * p; m <= n; m += p) composite[m] = true;
        long count = 0, last = 0, sum = 0;
        for (int i = 2; i <= n; i++)
            if (!composite[i]) { count++; last = i; sum += i; }
        return new long[] { count, last, sum };
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (long v in (long[])res) sink(v);
    }

    public static void Release(object inst, object res) { }
}
