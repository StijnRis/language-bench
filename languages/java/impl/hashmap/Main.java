import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        long n = Long.parseLong(args[0]);
        long x = 1;
        HashMap<Integer, Integer> m = new HashMap<>();

        for (long i = 0; i < n; i++) {
            x = x * 48271 % 2147483647;
            m.merge((int) (x % (n / 2)), 1, Integer::sum);
        }

        long checksum = 0;
        for (Map.Entry<Integer, Integer> e : m.entrySet()) checksum += (long) e.getKey() * e.getValue();

        long hits = 0;
        for (long i = 0; i < n; i++) {
            x = x * 48271 % 2147483647;
            Integer c = m.get((int) (x % n));
            if (c != null) hits += c;
        }

        System.out.println("distinct=" + m.size());
        System.out.println("checksum=" + checksum);
        System.out.println("hits=" + hits);
    }
}
