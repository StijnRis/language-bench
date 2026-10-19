import java.util.function.LongConsumer;

final class Problem {
    static long nArg = 2000000;
    static int workersArg = 4;

    static boolean isPrime(long n) {
        if (n < 2) return false;
        if (n < 4) return true;
        if (n % 2 == 0) return false;
        for (long d = 3; d * d <= n; d += 2)
            if (n % d == 0) return false;
        return true;
    }

    static void setup(String[] args) {
        if (args.length > 1) { nArg = Long.parseLong(args[0]); workersArg = Integer.parseInt(args[1]); }
    }

    static Object decode(byte[] data) { return null; }

    static Object solve(Object inst) {
        final long n = nArg;
        final int workers = workersArg;
        final long[] counts = new long[workers];
        Thread[] threads = new Thread[workers];
        for (int t = 0; t < workers; t++) {
            final int id = t;
            threads[t] = new Thread(() -> {
                long c = 0;
                for (long i = id; i < n; i += workers)
                    if (isPrime(i)) c++;
                counts[id] = c;
            });
            threads[t].start();
        }
        long total = 0;
        for (int t = 0; t < workers; t++) {
            try { threads[t].join(); } catch (InterruptedException e) { throw new RuntimeException(e); }
            total += counts[t];
        }
        return new long[] {total};
    }

    static void emit(Object res, LongConsumer sink) { sink.accept(((long[]) res)[0]); }

    static void release(Object inst, Object res) {}
}
