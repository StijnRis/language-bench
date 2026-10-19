using System.Text.Json;

public static class Problem
{
    static long objects, intSum, strLen, trues, nulls;

    static void Walk(JsonElement v)
    {
        switch (v.ValueKind)
        {
            case JsonValueKind.Object:
                objects++;
                foreach (var p in v.EnumerateObject()) Walk(p.Value);
                break;
            case JsonValueKind.Array:
                foreach (var e in v.EnumerateArray()) Walk(e);
                break;
            case JsonValueKind.Number:
                intSum += v.GetInt64();
                break;
            case JsonValueKind.String:
                strLen += v.GetString().Length;
                break;
            case JsonValueKind.True:
                trues++;
                break;
            case JsonValueKind.Null:
                nulls++;
                break;
        }
    }

    public static void Setup(string[] args) { }

    public static object Decode(byte[] data) => data; // the bytes are parsed inside Solve

    public static object Solve(object inst)
    {
        objects = intSum = strLen = trues = nulls = 0;
        using JsonDocument doc = JsonDocument.Parse((byte[])inst);
        Walk(doc.RootElement);
        return new long[] { objects, intSum, strLen, trues, nulls };
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (long v in (long[])res) sink(v);
    }

    public static void Release(object inst, object res) { }
}
