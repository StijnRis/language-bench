import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.HashMap;
import java.util.Map;
import java.util.function.LongConsumer;

final class Problem {
    static void setup(String[] args) {}

    static Object decode(byte[] data) {
        int n = data.length / 8;
        int[][] in = new int[2][n];
        ByteBuffer b = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
        b.asIntBuffer().get(in[0]);
        b.position(n * 4);
        b.asIntBuffer().get(in[1]);
        return in;
    }

    static Object solve(Object inst) {
        int[][] in = (int[][]) inst;
        HashMap<Integer, Integer> m = new HashMap<>();
        for (int k : in[0]) m.merge(k, 1, Integer::sum);
        long checksum = 0;
        for (Map.Entry<Integer, Integer> e : m.entrySet()) checksum += (long) e.getKey() * e.getValue();
        long hits = 0;
        for (int k : in[1]) {
            Integer c = m.get(k);
            if (c != null) hits += c;
        }
        return new long[] {m.size(), checksum, hits};
    }

    static void emit(Object res, LongConsumer sink) {
        for (long v : (long[]) res) sink.accept(v);
    }

    static void release(Object inst, Object res) {}
}
