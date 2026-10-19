// conformance problem: sum, maximum and a checksum of 4096 int32 values
import 'dart:typed_data';

void setup(List<String> args) {}

Object? decode(Uint8List data) => data.buffer.asInt32List(data.offsetInBytes, data.length ~/ 4);

Object? solve(Object? inst) {
  final a = inst as Int32List;
  var sum = 0, mx = 0, sq = 0;
  for (var i = 0; i < a.length; i++) {
    final v = a[i];
    sum += v;
    if (v > mx) mx = v;
    sq = (sq + v * v) % 1000003;
  }
  return <int>[sum, mx, sq, a.length];
}

List<int> emit(Object? res) => res as List<int>;
