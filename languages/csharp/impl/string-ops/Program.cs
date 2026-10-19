using System.Text;

public static class Problem
{
    public static void Setup(string[] args) { }

    public static object Decode(byte[] data) => Encoding.UTF8.GetString(data);

    public static object Solve(object inst)
    {
        string text = (string)inst;
        long bytes = Encoding.UTF8.GetByteCount(text);
        long codepoints = 0;
        foreach (Rune _ in text.EnumerateRunes()) codepoints++;
        long spaces = 0;
        foreach (char ch in text) if (ch == ' ') spaces++;
        long needle = 0;
        for (int p = text.IndexOf("er", StringComparison.Ordinal); p != -1; p = text.IndexOf("er", p + 2, StringComparison.Ordinal)) needle++;
        long checksum = 0;
        foreach (byte b in Encoding.UTF8.GetBytes(text.Replace(' ', '_'))) checksum += b;
        return new long[] { bytes, codepoints, spaces + 1, needle, checksum };
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (long v in (long[])res) sink(v);
    }

    public static void Release(object inst, object res) { }
}
