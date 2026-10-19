// Binary trees, after the Computer Language Benchmarks Game (plain objects, .NET garbage collector).
public static class Problem
{
    sealed class Node
    {
        public readonly Node Left, Right;
        public Node(Node left, Node right) { Left = left; Right = right; }
    }

    static int depthArg = 14;

    static Node Make(int d) => d == 0 ? new Node(null, null) : new Node(Make(d - 1), Make(d - 1));

    static long Check(Node n) => n.Left == null ? 1 : 1 + Check(n.Left) + Check(n.Right);

    public static void Setup(string[] args)
    {
        if (args.Length > 0) depthArg = int.Parse(args[0]);
    }

    public static object Decode(byte[] data) => null;

    public static object Solve(object inst)
    {
        int minDepth = 4, maxDepth = Math.Max(minDepth + 2, depthArg), stretch = maxDepth + 1;
        var output = new List<long> { Check(Make(stretch)) };
        Node longLived = Make(maxDepth);
        for (int depth = minDepth; depth <= maxDepth; depth += 2)
        {
            long iterations = 1L << (maxDepth - depth + minDepth), sum = 0;
            for (long i = 0; i < iterations; i++) sum += Check(Make(depth));
            output.Add(iterations);
            output.Add(sum);
        }
        output.Add(Check(longLived));
        return output;
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (long v in (List<long>)res) sink(v);
    }

    public static void Release(object inst, object res) { }
}
