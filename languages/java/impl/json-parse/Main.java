/* Java has no JSON parser in its standard library: a small recursive-descent parser that aggregates
 * while parsing (it does not build a tree). */
import java.util.function.LongConsumer;

final class Problem {
    static byte[] s;
    static int i;
    static long objects, strLen, trues, nulls, intSum;

    static void ws() {
        while (s[i] == ' ' || s[i] == '\n' || s[i] == '\r' || s[i] == '\t') i++;
    }

    static long string() {
        long n = 0;
        i++;
        for (;;) {
            byte c = s[i];
            if (c == '"') {
                i++;
                return n;
            }
            if (c == '\\') i += (s[i + 1] == 'u') ? 6 : 2;
            else i++;
            n++;
        }
    }

    static void value() {
        ws();
        switch (s[i]) {
            case '{':
                objects++;
                i++;
                ws();
                if (s[i] == '}') {
                    i++;
                    return;
                }
                for (;;) {
                    ws();
                    string();
                    ws();
                    i++; // ':'
                    value();
                    ws();
                    if (s[i++] == '}') return;
                }
            case '[':
                i++;
                ws();
                if (s[i] == ']') {
                    i++;
                    return;
                }
                for (;;) {
                    value();
                    ws();
                    if (s[i++] == ']') return;
                }
            case '"':
                strLen += string();
                return;
            case 't':
                trues++;
                i += 4;
                return;
            case 'f':
                i += 5;
                return;
            case 'n':
                nulls++;
                i += 4;
                return;
            default: {
                boolean neg = s[i] == '-';
                if (neg) i++;
                long v = 0;
                while (s[i] >= '0' && s[i] <= '9') v = v * 10 + (s[i++] - '0');
                intSum += neg ? -v : v;
            }
        }
    }

    static void setup(String[] args) {}

    static Object decode(byte[] data) { return data; }

    static Object solve(Object inst) {
        byte[] data = (byte[]) inst;
        s = java.util.Arrays.copyOf(data, data.length + 1);
        i = 0; objects = strLen = trues = nulls = intSum = 0;
        value();
        return new long[] {objects, intSum, strLen, trues, nulls};
    }

    static void emit(Object res, LongConsumer sink) {
        for (long v : (long[]) res) sink.accept(v);
    }

    static void release(Object inst, Object res) {}
}
