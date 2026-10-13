using System.Text;

string[] vocab =
{
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world",
};

int n = int.Parse(args[0]);
long x = 1;
var sb = new StringBuilder();
for (int i = 0; i < n; i++)
{
    x = x * 48271 % 2147483647;
    if (i > 0) sb.Append(' ');
    sb.Append(vocab[(int)(x % vocab.Length)]);
}
string text = sb.ToString();

long bytes = Encoding.UTF8.GetByteCount(text);
long codepoints = 0;
foreach (Rune _ in text.EnumerateRunes()) codepoints++;
long words = text.Split(' ').Length;

long needle = 0;
for (int p = text.IndexOf("er", StringComparison.Ordinal); p != -1; p = text.IndexOf("er", p + 2, StringComparison.Ordinal)) needle++;

long checksum = 0;
foreach (byte b in Encoding.UTF8.GetBytes(text.Replace(' ', '_'))) checksum += b;

Console.WriteLine($"bytes={bytes}");
Console.WriteLine($"codepoints={codepoints}");
Console.WriteLine($"words={words}");
Console.WriteLine($"needle={needle}");
Console.WriteLine($"checksum={checksum}");
