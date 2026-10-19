using System.Text;

public static class Problem
{
    public static void Setup(string[] args) { }

    public static object Decode(byte[] data) => Encoding.UTF8.GetString(data); // path of the file

    public static object Solve(object inst)
    {
        var freq = new Dictionary<string, int>();
        long lines = 0, total = 0;
        using (var reader = new StreamReader((string)inst, Encoding.Latin1, false, 1 << 16))
        {
            string line;
            while ((line = reader.ReadLine()) != null)
            {
                int c1 = line.IndexOf(',');
                int c2 = line.IndexOf(',', c1 + 1);
                string word = line.Substring(c1 + 1, c2 - c1 - 1);
                total += long.Parse(line.AsSpan(c2 + 1));
                freq[word] = freq.GetValueOrDefault(word) + 1;
                lines++;
            }
        }
        string top = null;
        int topCount = -1;
        foreach (var (w, c) in freq)
        {
            if (c > topCount || (c == topCount && string.CompareOrdinal(w, top) < 0)) { top = w; topCount = c; }
        }
        var output = new List<long> { lines, total, freq.Count, topCount, top.Length };
        foreach (char ch in top) output.Add(ch);
        return output;
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (long v in (List<long>)res) sink(v);
    }

    public static void Release(object inst, object res) { }
}
