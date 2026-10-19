import java.util.function.LongConsumer;

final class Problem {
    static int nArg = 10000000;

    static void setup(String[] args) {
        if (args.length > 0) nArg = Integer.parseInt(args[0]);
    }

    static Object decode(byte[] data) { return null; }

    static Object solve(Object inst) {
        int n = nArg;
        boolean[] composite = new boolean[n + 1];
        for (long p = 2; p * p <= n; p++)
            if (!composite[(int) p])
                for (long m = p * p; m <= n; m += p) composite[(int) m] = true;
        long count = 0, last = 0, sum = 0;
        for (int i = 2; i <= n; i++)
            if (!composite[i]) { count++; last = i; sum += i; }
        return new long[] {count, last, sum};
    }

    static void emit(Object res, LongConsumer sink) {
        for (long v : (long[]) res) sink.accept(v);
    }

    static void release(Object inst, Object res) {}
}
