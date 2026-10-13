import java.nio.charset.StandardCharsets;

public class Main {
    static final String[] VOCAB = {
        "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
        "über", "résumé", "привет", "мир",
        "код", "日本語", "世界", "速度", "hello", "world",
    };

    public static void main(String[] args) {
        int n = Integer.parseInt(args[0]);
        long x = 1;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            x = x * 48271 % 2147483647;
            if (i > 0) sb.append(' ');
            sb.append(VOCAB[(int) (x % VOCAB.length)]);
        }
        String text = sb.toString();

        long bytes = text.getBytes(StandardCharsets.UTF_8).length;
        long codepoints = text.codePointCount(0, text.length());
        long words = text.split(" ").length;

        long needle = 0;
        for (int p = text.indexOf("er"); p != -1; p = text.indexOf("er", p + 2)) needle++;

        long checksum = 0;
        for (byte b : text.replace(' ', '_').getBytes(StandardCharsets.UTF_8)) checksum += b & 0xFF;

        System.out.println("bytes=" + bytes);
        System.out.println("codepoints=" + codepoints);
        System.out.println("words=" + words);
        System.out.println("needle=" + needle);
        System.out.println("checksum=" + checksum);
    }
}
