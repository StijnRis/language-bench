int n = int.Parse(args[0]);
var a = new double[n * n];
var b = new double[n * n];
var c = new double[n * n];
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
    {
        a[i * n + j] = (i * 31 + j * 17) % 10 + 1;
        b[i * n + j] = (i * 13 + j * 7) % 10 - 4;
    }

for (int i = 0; i < n; i++)
    for (int k = 0; k < n; k++)
    {
        double aik = a[i * n + k];
        for (int j = 0; j < n; j++) c[i * n + j] += aik * b[k * n + j];
    }

double trace = 0, sum = 0;
for (int i = 0; i < n; i++) trace += c[i * n + i];
foreach (double v in c) sum += v;
Console.WriteLine($"trace={(long)trace}");
Console.WriteLine($"sum={(long)sum}");
Console.WriteLine($"c00={(long)c[0]}");
Console.WriteLine($"clast={(long)c[n * n - 1]}");
