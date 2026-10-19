import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;
import java.util.function.LongConsumer;

final class Problem {
    static void setup(String[] args) {}

    static Object decode(byte[] data) {
        int[] a = new int[data.length / 4];
        ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN).asIntBuffer().get(a);
        return a;
    }

    static Object solve(Object inst) {
        int[] a = (int[]) inst;
        Arrays.sort(a);
        return a;
    }

    static void emit(Object res, LongConsumer sink) {
        for (int v : (int[]) res) sink.accept(v);
    }

    static void release(Object inst, Object res) {}
}
