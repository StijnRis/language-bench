public static class Problem
{
    public static void Setup(string[] args) { }

    public static object Decode(byte[] data)
    {
        int n = data.Length / 8;
        var keys = new uint[n];
        var lookups = new uint[n];
        Buffer.BlockCopy(data, 0, keys, 0, n * 4);
        Buffer.BlockCopy(data, n * 4, lookups, 0, n * 4);
        return new uint[][] { keys, lookups };
    }

    public static object Solve(object inst)
    {
        var io = (uint[][])inst;
        var m = new Dictionary<uint, uint>();
        foreach (uint k in io[0]) m[k] = m.GetValueOrDefault(k) + 1;
        ulong checksum = 0;
        foreach (var (k, c) in m) checksum += (ulong)k * c;
        ulong hits = 0;
        foreach (uint k in io[1])
            if (m.TryGetValue(k, out uint c)) hits += c;
        return new long[] { m.Count, (long)checksum, (long)hits };
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (long v in (long[])res) sink(v);
    }

    public static void Release(object inst, object res) { }
}
