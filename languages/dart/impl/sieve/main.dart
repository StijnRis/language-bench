import 'dart:typed_data';

var nArg = 10000000;

void setup(List<String> args) {
  if (args.isNotEmpty) nArg = int.parse(args[0]);
}

Object? decode(Uint8List data) => null;

Object? solve(Object? inst) {
  final n = nArg;
  final composite = Uint8List(n + 1);
  for (var p = 2; p * p <= n; p++) {
    if (composite[p] == 0) {
      for (var m = p * p; m <= n; m += p) {
        composite[m] = 1;
      }
    }
  }
  var count = 0, last = 0, sum = 0;
  for (var i = 2; i <= n; i++) {
    if (composite[i] == 0) {
      count++;
      last = i;
      sum += i;
    }
  }
  return <int>[count, last, sum];
}

List<int> emit(Object? res) => res as List<int>;
