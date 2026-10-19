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
        Array.Sort(a);
        return a;
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (int v in (int[])res) sink(v);
    }

    public static void Release(object inst, object res) { }
}
