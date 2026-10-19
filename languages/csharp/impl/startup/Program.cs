// start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
public static class Problem
{
    public static void Setup(string[] args) { }
    public static object Decode(byte[] data) => null;
    public static object Solve(object inst) => null;
    public static void Emit(object res, Action<long> sink) => sink(1);
    public static void Release(object inst, object res) { }
}
