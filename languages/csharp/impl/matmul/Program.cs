public static class Problem
{
    public static void Setup(string[] args) { }

    public static object Decode(byte[] data)
    {
        int n = BitConverter.ToInt32(data, 0);
        var a = new double[n * n];
        var b = new double[n * n];
        Buffer.BlockCopy(data, 4, a, 0, n * n * 8);
        Buffer.BlockCopy(data, 4 + n * n * 8, b, 0, n * n * 8);
        return new object[] { n, a, b };
    }

    public static object Solve(object inst)
    {
        var o = (object[])inst;
        int n = (int)o[0];
        var a = (double[])o[1];
        var b = (double[])o[2];
        var c = new double[n * n];
        for (int i = 0; i < n; i++)
            for (int k = 0; k < n; k++)
            {
                double aik = a[i * n + k];
                for (int j = 0; j < n; j++) c[i * n + j] += aik * b[k * n + j];
            }
        return c;
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (double v in (double[])res) sink((long)Math.Floor(v + 0.5));
    }

    public static void Release(object inst, object res) { }
}
