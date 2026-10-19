// conformance problem: sum, maximum and a checksum of 4096 int32 values
public static class Problem
{
    public static void Setup(string[] args) { }

    public static object Decode(byte[] data)
    {
        var a = new int[data.Length / 4];
        Buffer.BlockCopy(data, 0, a, 0, data.Length);
        return a;
    }

    public static object Solve(object inst)
    {
        var a = (int[])inst;
        long sum = 0, mx = 0, sq = 0;
        foreach (int x in a) { long v = x; sum += v; if (v > mx) mx = v; sq = (sq + v * v) % 1000003; }
        return new long[] { sum, mx, sq, a.Length };
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (long v in (long[])res) sink(v);
    }

    public static void Release(object inst, object res) { }
}
