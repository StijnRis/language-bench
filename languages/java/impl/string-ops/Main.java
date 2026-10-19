import java.nio.charset.StandardCharsets;
import java.util.function.LongConsumer;

final class Problem {
    static void setup(String[] args) {}

    static Object decode(byte[] data) { return new String(data, StandardCharsets.UTF_8); }

    static Object solve(Object inst) {
        String text = (String) inst;
        long bytes = text.getBytes(StandardCharsets.UTF_8).length;
        long codepoints = text.codePointCount(0, text.length());
        long spaces = 0;
        for (int i = 0; i < text.length(); i++) if (text.charAt(i) == ' ') spaces++;
        long needle = 0;
        for (int p = text.indexOf("er"); p != -1; p = text.indexOf("er", p + 2)) needle++;
        long checksum = 0;
        for (byte b : text.replace(' ', '_').getBytes(StandardCharsets.UTF_8)) checksum += b & 0xff;
        return new long[] {bytes, codepoints, spaces + 1, needle, checksum};
    }

    static void emit(Object res, LongConsumer sink) {
        for (long v : (long[]) res) sink.accept(v);
    }

    static void release(Object inst, Object res) {}
}
