int n = int.Parse(args[0]);
long x = 1;
int[] a = new int[n];
for (int i = 0; i < n; i++)
{
    x = x * 48271 % 2147483647;
    a[i] = (int)x;
}

Array.Sort(a);

long checksum = 0;
for (int i = 0; i < n; i++) checksum = (checksum + (long)i * a[i]) % 1000000007L;

Console.WriteLine($"first={a[0]}");
Console.WriteLine($"last={a[n - 1]}");
Console.WriteLine($"median={a[n / 2]}");
Console.WriteLine($"checksum={checksum}");
