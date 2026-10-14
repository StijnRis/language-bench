public class Main {
    public static void main(String[] args) {
        int n = Integer.parseInt(args[0]);
        boolean[] composite = new boolean[n + 1];
        for (long p = 2; p * p <= n; p++)
            if (!composite[(int) p])
                for (long m = p * p; m <= n; m += p) composite[(int) m] = true;
        long count = 0, last = 0, sum = 0;
        for (int i = 2; i <= n; i++)
            if (!composite[i]) {
                count++;
                last = i;
                sum += i;
            }
        System.out.println("count=" + count);
        System.out.println("last=" + last);
        System.out.println("sum=" + sum);
    }
}
