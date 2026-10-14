public class Main {
    public static void main(String[] args) {
        int n = Integer.parseInt(args[0]);
        int[] perm1 = new int[n], perm = new int[n], count = new int[n];
        for (int i = 0; i < n; i++) perm1[i] = i;
        int maxflips = 0, permcount = 0, r = n;
        long checksum = 0;
        while (true) {
            while (r != 1) {
                count[r - 1] = r;
                r--;
            }
            System.arraycopy(perm1, 0, perm, 0, n);
            int flips = 0, k;
            while ((k = perm[0]) != 0) {
                for (int i = 0, j = k; i < j; i++, j--) {
                    int t = perm[i];
                    perm[i] = perm[j];
                    perm[j] = t;
                }
                flips++;
            }
            if (flips > maxflips) maxflips = flips;
            checksum += (permcount % 2 == 0) ? flips : -flips;
            while (true) {
                if (r == n) {
                    System.out.println("checksum=" + checksum);
                    System.out.println("maxflips=" + maxflips);
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
    }
}
