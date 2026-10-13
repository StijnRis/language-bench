import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) throws IOException {
        HashMap<String, int[]> freq = new HashMap<>();
        long lines = 0, total = 0;

        try (BufferedReader r = Files.newBufferedReader(Path.of(args[0]), StandardCharsets.ISO_8859_1)) {
            String line;
            while ((line = r.readLine()) != null) {
                int c1 = line.indexOf(',');
                int c2 = line.indexOf(',', c1 + 1);
                String word = line.substring(c1 + 1, c2);
                total += Long.parseLong(line, c2 + 1, line.length(), 10);
                freq.computeIfAbsent(word, k -> new int[1])[0]++;
                lines++;
            }
        }

        String top = null;
        int topCount = -1;
        for (Map.Entry<String, int[]> e : freq.entrySet()) {
            int c = e.getValue()[0];
            if (c > topCount || (c == topCount && e.getKey().compareTo(top) < 0)) {
                top = e.getKey();
                topCount = c;
            }
        }

        System.out.println("lines=" + lines);
        System.out.println("sum=" + total);
        System.out.println("distinct=" + freq.size());
        System.out.println("top=" + top + " " + topCount);
    }
}
