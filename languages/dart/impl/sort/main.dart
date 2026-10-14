import 'dart:typed_data';

void main(List<String> args) {
  final n = int.parse(args[0]);
  var x = 1;
  final a = Int32List(n);
  for (var i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    a[i] = x;
  }

  a.sort();

  var checksum = 0;
  for (var i = 0; i < n; i++) {
    checksum = (checksum + i * a[i]) % 1000000007;
  }

  print('first=${a[0]}');
  print('last=${a[n - 1]}');
  print('median=${a[n ~/ 2]}');
  print('checksum=$checksum');
}
