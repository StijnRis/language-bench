/* Binary trees, after the Computer Language Benchmarks Game (plain objects, JVM garbage collector). */
public class Main {
    static final class Node {
        final Node left, right;

        Node(Node left, Node right) {
            this.left = left;
            this.right = right;
        }
    }

    static Node make(int d) {
        return d == 0 ? new Node(null, null) : new Node(make(d - 1), make(d - 1));
    }

    static long check(Node n) {
        return n.left == null ? 1 : 1 + check(n.left) + check(n.right);
    }

    public static void main(String[] args) {
        int n = Integer.parseInt(args[0]);
        int minDepth = 4;
        int maxDepth = n > minDepth + 2 ? n : minDepth + 2;
        int stretch = maxDepth + 1;

        System.out.println("stretch tree of depth " + stretch + "\t check: " + check(make(stretch)));
        Node longLived = make(maxDepth);

        for (int depth = minDepth; depth <= maxDepth; depth += 2) {
            long iterations = 1L << (maxDepth - depth + minDepth);
            long sum = 0;
            for (long i = 0; i < iterations; i++) sum += check(make(depth));
            System.out.println(iterations + "\t trees of depth " + depth + "\t check: " + sum);
        }

        System.out.println("long lived tree of depth " + maxDepth + "\t check: " + check(longLived));
    }
}
