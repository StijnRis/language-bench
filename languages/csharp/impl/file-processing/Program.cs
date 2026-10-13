using System.Text;

var freq = new Dictionary<string, int>();
long lines = 0, total = 0;

using (var reader = new StreamReader(args[0], Encoding.Latin1, false, 1 << 16))
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
    if (c > topCount || (c == topCount && string.CompareOrdinal(w, top) < 0))
    {
        top = w;
        topCount = c;
    }
}

Console.WriteLine($"lines={lines}");
Console.WriteLine($"sum={total}");
Console.WriteLine($"distinct={freq.Count}");
Console.WriteLine($"top={top} {topCount}");
