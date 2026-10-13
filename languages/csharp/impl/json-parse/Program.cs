using System.Text.Json;

long objects = 0, intSum = 0, strLen = 0, trues = 0, nulls = 0;

void Walk(JsonElement v)
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

byte[] data = File.ReadAllBytes(args[0]);
using JsonDocument doc = JsonDocument.Parse(data);
Walk(doc.RootElement);

Console.WriteLine($"objects={objects}");
Console.WriteLine($"int_sum={intSum}");
Console.WriteLine($"string_length={strLen}");
Console.WriteLine($"true={trues}");
Console.WriteLine($"null={nulls}");
