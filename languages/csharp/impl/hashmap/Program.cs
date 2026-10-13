ulong n = ulong.Parse(args[0]);
ulong x = 1;
var m = new Dictionary<uint, uint>();

for (ulong i = 0; i < n; i++)
{
    x = x * 48271 % 2147483647;
    uint k = (uint)(x % (n / 2));
    m[k] = m.GetValueOrDefault(k) + 1;
}

ulong checksum = 0;
foreach (var (k, c) in m) checksum += (ulong)k * c;

ulong hits = 0;
for (ulong i = 0; i < n; i++)
{
    x = x * 48271 % 2147483647;
    if (m.TryGetValue((uint)(x % n), out uint c)) hits += c;
}

Console.WriteLine($"distinct={m.Count}");
Console.WriteLine($"checksum={checksum}");
Console.WriteLine($"hits={hits}");
