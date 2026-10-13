// Binary trees, after the Computer Language Benchmarks Game (plain objects, .NET garbage collector).
static Node Make(int d) => d == 0 ? new Node(null, null) : new Node(Make(d - 1), Make(d - 1));

static long Check(Node n) => n.Left == null ? 1 : 1 + Check(n.Left) + Check(n.Right);

int n = int.Parse(args[0]);
int minDepth = 4;
int maxDepth = n > minDepth + 2 ? n : minDepth + 2;
int stretch = maxDepth + 1;

Console.WriteLine($"stretch tree of depth {stretch}\t check: {Check(Make(stretch))}");
Node longLived = Make(maxDepth);

for (int depth = minDepth; depth <= maxDepth; depth += 2)
{
    long iterations = 1L << (maxDepth - depth + minDepth);
    long sum = 0;
    for (long i = 0; i < iterations; i++) sum += Check(Make(depth));
    Console.WriteLine($"{iterations}\t trees of depth {depth}\t check: {sum}");
}

Console.WriteLine($"long lived tree of depth {maxDepth}\t check: {Check(longLived)}");

sealed class Node
{
    public readonly Node Left, Right;

    public Node(Node left, Node right)
    {
        Left = left;
        Right = right;
    }
}
