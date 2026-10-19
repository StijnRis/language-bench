import 'dart:isolate';
import 'dart:typed_data';

var nArg = 2000000, workersArg = 4;

void setup(List<String> args) {
  if (args.length > 1) {
    nArg = int.parse(args[0]);
    workersArg = int.parse(args[1]);
  }
}

bool isPrime(int n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 == 0) return false;
  for (var d = 3; d * d <= n; d += 2) {
    if (n % d == 0) return false;
  }
  return true;
}

void worker(List<Object> msg) {
  final send = msg[0] as SendPort;
  final n = msg[1] as int;
  final workers = msg[2] as int;
  final t = msg[3] as int;
  var count = 0;
  for (var i = t; i < n; i += workers) {
    if (isPrime(i)) count++;
  }
  send.send(count);
}

Object? decode(Uint8List data) => null;

// one Isolate per share, started inside the timed region (an isolate has its own heap and thread)
Future<Object?> solve(Object? inst) async {
  final port = ReceivePort();
  for (var t = 0; t < workersArg; t++) {
    await Isolate.spawn(worker, <Object>[port.sendPort, nArg, workersArg, t]);
  }
  var total = 0, done = 0;
  await for (final c in port) {
    total += c as int;
    if (++done == workersArg) port.close();
  }
  return <int>[total];
}

List<int> emit(Object? res) => res as List<int>;
