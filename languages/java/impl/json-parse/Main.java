/* Java has no JSON parser in its standard library: a small recursive-descent parser that aggregates
 * while parsing (it does not build a tree). */
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
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

    public static void main(String[] args) throws IOException {
        byte[] data = Files.readAllBytes(Path.of(args[0]));
        s = new byte[data.length + 1];
        System.arraycopy(data, 0, s, 0, data.length);
        value();
        System.out.println("objects=" + objects);
        System.out.println("int_sum=" + intSum);
        System.out.println("string_length=" + strLen);
        System.out.println("true=" + trues);
        System.out.println("null=" + nulls);
    }
}
