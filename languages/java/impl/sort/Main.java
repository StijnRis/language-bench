import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int n = Integer.parseInt(args[0]);
        long x = 1;
        int[] a = new int[n];
        for (int i = 0; i < n; i++) {
            x = x * 48271 % 2147483647;
            a[i] = (int) x;
        }

        Arrays.sort(a);

        long checksum = 0;
        for (int i = 0; i < n; i++) checksum = (checksum + (long) i * a[i]) % 1000000007L;

        System.out.println("first=" + a[0]);
        System.out.println("last=" + a[n - 1]);
        System.out.println("median=" + a[n / 2]);
        System.out.println("checksum=" + checksum);
    }
}
