import 'dart:typed_data';

var nArg = 9;

void setup(List<String> args) {
  if (args.isNotEmpty) nArg = int.parse(args[0]);
}

Object? decode(Uint8List data) => null;

Object? solve(Object? inst) {
  final n = nArg;
  final perm1 = Int32List(n), perm = Int32List(n), count = Int32List(n);
  for (var i = 0; i < n; i++) {
    perm1[i] = i;
  }
  var maxflips = 0, permcount = 0, checksum = 0, r = n;
  for (;;) {
    while (r != 1) {
      count[r - 1] = r;
      r--;
    }
    perm.setAll(0, perm1);
    var flips = 0, k = perm[0];
    while (k != 0) {
      for (var i = 0, j = k; i < j; i++, j--) {
        final t = perm[i];
        perm[i] = perm[j];
        perm[j] = t;
      }
      flips++;
      k = perm[0];
    }
    if (flips > maxflips) maxflips = flips;
    checksum += permcount % 2 == 0 ? flips : -flips;
    for (;;) {
      if (r == n) return <int>[checksum, maxflips];
      final p0 = perm1[0];
      for (var i = 0; i < r; i++) {
        perm1[i] = perm1[i + 1];
      }
      perm1[r] = p0;
      if (--count[r] > 0) break;
      r++;
    }
    permcount++;
  }
}

List<int> emit(Object? res) => res as List<int>;
