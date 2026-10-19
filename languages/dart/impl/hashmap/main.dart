import 'dart:typed_data';

void setup(List<String> args) {}

Object? decode(Uint8List data) {
  final all = data.buffer.asInt32List(data.offsetInBytes, data.length ~/ 4);
  final n = all.length ~/ 2;
  return [Int32List.sublistView(all, 0, n), Int32List.sublistView(all, n)];
}

Object? solve(Object? inst) {
  final keys = (inst as List)[0] as Int32List;
  final lookups = inst[1] as Int32List;
  final m = <int, int>{};
  for (var i = 0; i < keys.length; i++) {
    final k = keys[i];
    m[k] = (m[k] ?? 0) + 1;
  }
  var checksum = 0;
  m.forEach((k, c) => checksum += k * c);
  var hits = 0;
  for (var i = 0; i < lookups.length; i++) {
    hits += m[lookups[i]] ?? 0;
  }
  return <int>[m.length, checksum, hits];
}

List<int> emit(Object? res) => res as List<int>;
