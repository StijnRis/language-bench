import 'dart:typed_data';

void setup(List<String> args) {}

Object? decode(Uint8List data) {
  final view = ByteData.sublistView(data);
  final n = view.getInt32(0, Endian.little);
  final a = Float64List(n * n), b = Float64List(n * n);
  for (var i = 0; i < n * n; i++) {
    a[i] = view.getFloat64(4 + 8 * i, Endian.little);
    b[i] = view.getFloat64(4 + 8 * (n * n + i), Endian.little);
  }
  return [n, a, b];
}

Object? solve(Object? inst) {
  final l = inst as List;
  final n = l[0] as int;
  final a = l[1] as Float64List, b = l[2] as Float64List;
  final c = Float64List(n * n);
  for (var i = 0; i < n; i++) {
    for (var k = 0; k < n; k++) {
      final aik = a[i * n + k];
      for (var j = 0; j < n; j++) {
        c[i * n + j] += aik * b[k * n + j];
      }
    }
  }
  return c;
}

List<int> emit(Object? res) {
  final c = res as Float64List;
  return List<int>.generate(c.length, (i) => (c[i] + 0.5).floor());
}
