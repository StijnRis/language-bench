// Binary trees, after the Computer Language Benchmarks Game (plain objects, JVM garbage collector).
import java.util.ArrayList;
import java.util.function.LongConsumer;

final class Problem {
    static final class Node {
        final Node left, right;
        Node(Node l, Node r) { left = l; right = r; }
    }

    static int depthArg = 14;

    static Node make(int d) { return d == 0 ? new Node(null, null) : new Node(make(d - 1), make(d - 1)); }

    static long check(Node n) { return n.left == null ? 1 : 1 + check(n.left) + check(n.right); }

    static void setup(String[] args) {
        if (args.length > 0) depthArg = Integer.parseInt(args[0]);
    }

    static Object decode(byte[] data) { return null; }

    static Object solve(Object inst) {
        int minDepth = 4, maxDepth = Math.max(minDepth + 2, depthArg), stretch = maxDepth + 1;
        ArrayList<Long> out = new ArrayList<>();
        out.add(check(make(stretch)));
        Node longLived = make(maxDepth);
        for (int depth = minDepth; depth <= maxDepth; depth += 2) {
            long iterations = 1L << (maxDepth - depth + minDepth), sum = 0;
            for (long i = 0; i < iterations; i++) sum += check(make(depth));
            out.add(iterations);
            out.add(sum);
        }
        out.add(check(longLived));
        return out;
    }

    @SuppressWarnings("unchecked")
    static void emit(Object res, LongConsumer sink) {
        for (long v : (ArrayList<Long>) res) sink.accept(v);
    }

    static void release(Object inst, Object res) {}
}
