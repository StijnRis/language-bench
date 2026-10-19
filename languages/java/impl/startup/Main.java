// start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
import java.util.function.LongConsumer;

final class Problem {
    static void setup(String[] args) {}
    static Object decode(byte[] data) { return null; }
    static Object solve(Object inst) { return null; }
    static void emit(Object res, LongConsumer sink) { sink.accept(1); }
    static void release(Object inst, Object res) {}
}
