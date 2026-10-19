import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.function.LongConsumer;

final class Problem {
    static void setup(String[] args) {}

    static Object decode(byte[] data) { return new String(data, StandardCharsets.UTF_8); } // path of the file

    static Object solve(Object inst) {
        HashMap<String, int[]> freq = new HashMap<>();
        long lines = 0, total = 0;
        try (BufferedReader r = Files.newBufferedReader(Path.of((String) inst), StandardCharsets.ISO_8859_1)) {
            String line;
            while ((line = r.readLine()) != null) {
                int c1 = line.indexOf(',');
                int c2 = line.indexOf(',', c1 + 1);
                String word = line.substring(c1 + 1, c2);
                total += Long.parseLong(line, c2 + 1, line.length(), 10);
                freq.computeIfAbsent(word, k -> new int[1])[0]++;
                lines++;
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        String top = null;
        int topCount = -1;
        for (Map.Entry<String, int[]> e : freq.entrySet()) {
            int c = e.getValue()[0];
            if (c > topCount || (c == topCount && e.getKey().compareTo(top) < 0)) { top = e.getKey(); topCount = c; }
        }
        ArrayList<Long> out = new ArrayList<>();
        out.add(lines); out.add(total); out.add((long) freq.size()); out.add((long) topCount); out.add((long) top.length());
        for (int i = 0; i < top.length(); i++) out.add((long) top.charAt(i));
        return out;
    }

    @SuppressWarnings("unchecked")
    static void emit(Object res, LongConsumer sink) {
        for (long v : (ArrayList<Long>) res) sink.accept(v);
    }

    static void release(Object inst, Object res) {}
}
