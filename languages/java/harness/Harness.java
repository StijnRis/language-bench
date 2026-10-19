// language-bench harness for Java: see harness/CONTRACT.md. Compiled together with Problem.java (the problem's
// Main.java), which provides setup, decode, solve and emit; instance and result are opaque Objects.
import java.io.DataInputStream;
import java.io.IOException;
import java.time.Instant;

public final class Harness {
    private static double num(String k, double d) {
        String v = System.getenv(k);
        if (v == null || v.isEmpty()) return d;
        try { return Double.parseDouble(v); } catch (NumberFormatException e) { return d; }
    }

    private static String env(String k, String d) {
        String v = System.getenv(k);
        return v == null || v.isEmpty() ? d : v;
    }

    private static void fail(String msg) {
        System.err.println("harness: " + msg);
        System.exit(1);
    }

    public static void main(String[] args) throws Exception {
        String input = env("LB_INPUT", "none");
        double budget = num("LB_BUDGET_SECONDS", 10) * 1e9;
        long minIters = (long) num("LB_MIN_ITERS", 3), maxIters = (long) num("LB_MAX_ITERS", 0), start = (long) num("LB_START", 0);
        String gen = env("LB_GEN", "/usr/local/bin/lbgen"), file = env("LB_FILE", "/dev/shm/lb-input"), problem = env("LB_PROBLEM", "");
        boolean fileReady = System.getenv("LB_FILE_READY") != null;

        Problem.setup(args);
        DataInputStream in = new DataInputStream(new java.io.BufferedInputStream(System.in, 1 << 16));
        byte[] buf = new byte[0];
        long[] t0s = new long[1024], t1s = new long[1024], h1s = new long[1024], h2s = new long[1024];
        int iters = 0;
        double kernel = 0;
        Instant wallNow = Instant.now();
        long mono0 = System.nanoTime();
        long wall0 = wallNow.getEpochSecond() * 1_000_000_000L + wallNow.getNano();
        String reason = "budget";

        for (;;) {
            byte[] data;
            if (input.equals("stream")) {
                byte[] hdr = new byte[8];
                try { in.readFully(hdr); } catch (IOException e) { fail("input ended early"); }
                long len = 0;
                for (int i = 7; i >= 0; i--) len = (len << 8) | (hdr[i] & 0xff);
                if (buf.length != (int) len) buf = new byte[(int) len];
                try { in.readFully(buf); } catch (IOException e) { fail("input ended early"); }
                data = buf;
            } else if (input.equals("file")) {
                if (!fileReady) {
                    Process p = new ProcessBuilder(gen, "file", problem, Long.toString(start + iters), file).inheritIO().start();
                    if (p.waitFor() != 0) fail("generator failed");
                }
                data = file.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            } else {
                data = new byte[0];
            }
            Object inst = Problem.decode(data);
            long t0 = System.nanoTime();
            Object res = Problem.solve(inst);
            long t1 = System.nanoTime();
            Hasher h = new Hasher();
            Problem.emit(res, h);
            h.finish();
            long h1 = h.h1, h2 = h.h2;
            Problem.release(inst, res);
            if (input.equals("file") && !fileReady) new java.io.File(file).delete();

            if (iters == t0s.length) {
                t0s = java.util.Arrays.copyOf(t0s, iters * 2); t1s = java.util.Arrays.copyOf(t1s, iters * 2);
                h1s = java.util.Arrays.copyOf(h1s, iters * 2); h2s = java.util.Arrays.copyOf(h2s, iters * 2);
            }
            t0s[iters] = t0; t1s[iters] = t1; h1s[iters] = h1; h2s[iters] = h2; iters++;
            kernel += (double) (t1 - t0);
            if (maxIters > 0 && iters >= maxIters) { reason = "iters"; break; }
            if (kernel >= budget && iters >= minIters) break;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("LB 1 clock=System.nanoTime\nSTART mono=").append(mono0).append(" wall=").append(wall0).append('\n');
        for (int i = 0; i < iters; i++)
            sb.append("ITER ").append(i + 1).append(" t0=").append(t0s[i]).append(" t1=").append(t1s[i]).append(" check=").append(h1s[i]).append(':').append(h2s[i]).append('\n');
        sb.append("DONE iters=").append(iters).append(" kernel_ns=").append((long) kernel).append(" reason=").append(reason).append('\n');
        System.out.print(sb);
        System.out.flush();
    }

    /** the result hash of the contract: sink for emit(), then finish() mixes in the number of words */
    private static final class Hasher implements java.util.function.LongConsumer {
        long h1 = 17, h2 = 19, n = 0;

        private void mix(long w) {
            long m1 = ((w % 2147483647L) + 2147483647L) % 2147483647L, m2 = ((w % 2147483629L) + 2147483629L) % 2147483629L;
            h1 = (h1 * 1000003L + m1) % 2147483647L;
            h2 = (h2 * 999983L + m2) % 2147483629L;
        }

        public void accept(long w) { mix(w); n++; }

        void finish() { mix(n); }
    }
}
