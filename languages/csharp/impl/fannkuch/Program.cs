int n = int.Parse(args[0]);
var perm1 = new int[n];
var perm = new int[n];
var count = new int[n];
for (int i = 0; i < n; i++) perm1[i] = i;
int maxflips = 0, permcount = 0, r = n;
long checksum = 0;
while (true)
{
    while (r != 1)
    {
        count[r - 1] = r;
        r--;
    }
    Array.Copy(perm1, perm, n);
    int flips = 0, k;
    while ((k = perm[0]) != 0)
    {
        for (int i = 0, j = k; i < j; i++, j--)
        {
            int t = perm[i];
            perm[i] = perm[j];
            perm[j] = t;
        }
        flips++;
    }
    if (flips > maxflips) maxflips = flips;
    checksum += (permcount % 2 == 0) ? flips : -flips;
    while (true)
    {
        if (r == n)
        {
            Console.WriteLine($"checksum={checksum}");
            Console.WriteLine($"maxflips={maxflips}");
            return;
        }
        int p0 = perm1[0];
        for (int i = 0; i < r; i++) perm1[i] = perm1[i + 1];
        perm1[r] = p0;
        if (--count[r] > 0) break;
        r++;
    }
    permcount++;
}
