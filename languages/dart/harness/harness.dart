// language-bench harness for Dart: see harness/CONTRACT.md. Compiled together with problem.dart (the problem's
// main.dart), which provides setup(args), decode(bytes), solve(instance) (may be a Future),
// emit(result) -> List<int> (the canonical result words) and optionally release(instance, result).
import 'dart:io';
import 'dart:typed_data';

import 'problem.dart' as problem;

double num(String k, double d) {
  final v = Platform.environment[k];
  if (v == null || v.isEmpty) return d;
  return double.tryParse(v) ?? d;
}

String env(String k, String d) {
  final v = Platform.environment[k];
  return (v == null || v.isEmpty) ? d : v;
}

Never fail(String msg) {
  stderr.writeln('harness: $msg');
  exit(1);
}

Uint8List readFull(RandomAccessFile f, int n) {
  final buf = Uint8List(n);
  var off = 0;
  while (off < n) {
    final k = f.readIntoSync(buf, off, n);
    if (k <= 0) fail('input ended early');
    off += k;
  }
  return buf;
}

Future<void> main(List<String> args) async {
  final input = env('LB_INPUT', 'none');
  final budget = num('LB_BUDGET_SECONDS', 10) * 1e9;
  final minIters = num('LB_MIN_ITERS', 3).toInt();
  final maxIters = num('LB_MAX_ITERS', 0).toInt();
  final start = num('LB_START', 0).toInt();
  final gen = env('LB_GEN', '/usr/local/bin/lbgen');
  final file = env('LB_FILE', '/dev/shm/lb-input');
  final pname = env('LB_PROBLEM', '');
  final fileReady = Platform.environment.containsKey('LB_FILE_READY');
  const p1 = 2147483647, p2 = 2147483629;

  final sw = Stopwatch()..start();
  // Stopwatch is Dart's monotonic clock; its ticks are converted to nanoseconds
  int mono() => sw.elapsedTicks * 1000000000 ~/ sw.frequency;

  problem.setup(args);
  final stdinFile = input == 'stream' ? File('/dev/stdin').openSync() : null;
  final t0s = <int>[], t1s = <int>[], h1s = <int>[], h2s = <int>[];
  var kernel = 0;
  final mono0 = mono();
  final wall0 = DateTime.now().microsecondsSinceEpoch * 1000;
  var reason = 'budget';

  for (;;) {
    Uint8List data;
    if (input == 'stream') {
      final hdr = readFull(stdinFile!, 8);
      final len = ByteData.sublistView(hdr).getUint64(0, Endian.little);
      data = readFull(stdinFile, len);
    } else if (input == 'file') {
      if (!fileReady) {
        final r = Process.runSync(gen, ['file', pname, '${start + t0s.length}', file]);
        if (r.exitCode != 0) fail('generator failed');
      }
      data = Uint8List.fromList(file.codeUnits);
    } else {
      data = Uint8List(0);
    }
    final inst = problem.decode(data);
    final t0 = mono();
    final res = await problem.solve(inst);
    final t1 = mono();
    var h1 = 17, h2 = 19, n = 0;
    final words = problem.emit(res);
    for (final w in words) {
      h1 = (h1 * 1000003 + w % p1) % p1;
      h2 = (h2 * 999983 + w % p2) % p2;
      n++;
    }
    h1 = (h1 * 1000003 + n % p1) % p1;
    h2 = (h2 * 999983 + n % p2) % p2;
    if (input == 'file' && !fileReady) {
      final f = File(file);
      if (f.existsSync()) f.deleteSync();
    }
    t0s.add(t0);
    t1s.add(t1);
    h1s.add(h1);
    h2s.add(h2);
    kernel += t1 - t0;
    if (maxIters > 0 && t0s.length >= maxIters) {
      reason = 'iters';
      break;
    }
    if (kernel >= budget && t0s.length >= minIters) break;
  }

  final out = StringBuffer('LB 1 clock=Stopwatch\nSTART mono=$mono0 wall=$wall0\n');
  for (var i = 0; i < t0s.length; i++) {
    out.write('ITER ${i + 1} t0=${t0s[i]} t1=${t1s[i]} check=${h1s[i]}:${h2s[i]}\n');
  }
  out.write('DONE iters=${t0s.length} kernel_ns=$kernel reason=$reason\n');
  stdout.write(out);
  await stdout.flush();
  exit(0);
}
