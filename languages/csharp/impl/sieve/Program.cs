int n = int.Parse(args[0]);
var composite = new bool[n + 1];
for (long p = 2; p * p <= n; p++)
    if (!composite[p])
        for (long m = p * p; m <= n; m += p) composite[m] = true;
long count = 0, last = 0, sum = 0;
for (int i = 2; i <= n; i++)
    if (!composite[i])
    {
        count++;
        last = i;
        sum += i;
    }
Console.WriteLine($"count={count}");
Console.WriteLine($"last={last}");
Console.WriteLine($"sum={sum}");
