import 'dart:isolate';

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

Future<void> main(List<String> args) async {
  final n = int.parse(args[0]);
  final workers = int.parse(args[1]);
  final port = ReceivePort();
  for (var t = 0; t < workers; t++) {
    await Isolate.spawn(worker, <Object>[port.sendPort, n, workers, t]);
  }
  var total = 0;
  var done = 0;
  await for (final c in port) {
    total += c as int;
    if (++done == workers) port.close();
  }
  print('primes=$total');
}
