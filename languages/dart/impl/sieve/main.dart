import 'dart:typed_data';

void main(List<String> args) {
  final n = int.parse(args[0]);
  final s = Uint8List(n + 1);
  for (var i = 2; i <= n; i++) {
    s[i] = 1;
  }
  for (var p = 2; p * p <= n; p++) {
    if (s[p] == 1) {
      for (var m = p * p; m <= n; m += p) {
        s[m] = 0;
      }
    }
  }
  var count = 0, last = 0, sum = 0;
  for (var i = 2; i <= n; i++) {
    if (s[i] == 1) {
      count++;
      last = i;
      sum += i;
    }
  }
  print('count=$count');
  print('last=$last');
  print('sum=$sum');
}
