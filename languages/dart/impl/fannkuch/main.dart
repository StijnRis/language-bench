import 'dart:typed_data';

void main(List<String> args) {
  final n = int.parse(args[0]);
  final perm1 = Int32List(n);
  final perm = Int32List(n);
  final count = Int32List(n);
  for (var i = 0; i < n; i++) {
    perm1[i] = i;
  }
  var maxflips = 0, permcount = 0, r = n, checksum = 0;
  while (true) {
    while (r != 1) {
      count[r - 1] = r;
      r--;
    }
    perm.setAll(0, perm1);
    var flips = 0;
    var k = perm[0];
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
    while (true) {
      if (r == n) {
        print('checksum=$checksum');
        print('maxflips=$maxflips');
        return;
      }
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
