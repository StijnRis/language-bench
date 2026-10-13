public class Main {
    static boolean isPrime(long n) {
        if (n < 2) return false;
        if (n < 4) return true;
        if (n % 2 == 0) return false;
        for (long d = 3; d * d <= n; d += 2) if (n % d == 0) return false;
        return true;
    }

    public static void main(String[] args) throws InterruptedException {
        long n = Long.parseLong(args[0]);
        int workers = Integer.parseInt(args[1]);
        long[] counts = new long[workers];
        Thread[] threads = new Thread[workers];
        for (int t = 0; t < workers; t++) {
            final int id = t;
            threads[t] = new Thread(() -> {
                long c = 0;
                for (long i = id; i < n; i += workers) if (isPrime(i)) c++;
                counts[id] = c;
            });
            threads[t].start();
        }
        long total = 0;
        for (int t = 0; t < workers; t++) {
            threads[t].join();
            total += counts[t];
        }
        System.out.println("primes=" + total);
    }
}
