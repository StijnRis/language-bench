void main(List<String> args) {
  final n = int.parse(args[0]);
  var x = 1;
  final m = <int, int>{};
  final half = n ~/ 2;
  for (var i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    final k = x % half;
    m[k] = (m[k] ?? 0) + 1;
  }

  var checksum = 0;
  m.forEach((k, c) {
    checksum += k * c;
  });

  var hits = 0;
  for (var i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    hits += m[x % n] ?? 0;
  }

  print('distinct=${m.length}');
  print('checksum=$checksum');
  print('hits=$hits');
}
