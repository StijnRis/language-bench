import 'dart:typed_data';

void setup(List<String> args) {}

Object? decode(Uint8List data) => data.buffer.asInt32List(data.offsetInBytes, data.length ~/ 4);

Object? solve(Object? inst) {
  final a = inst as Int32List;
  a.sort();
  return a;
}

List<int> emit(Object? res) => res as Int32List;
