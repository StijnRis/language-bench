import 'dart:convert';
import 'dart:typed_data';

void setup(List<String> args) {}

Object? decode(Uint8List data) => data; // the bytes are decoded and parsed inside solve

Object? solve(Object? inst) {
  final doc = jsonDecode(utf8.decode(inst as Uint8List));
  var objects = 0, intSum = 0, strLen = 0, trues = 0, nulls = 0;
  final stack = <Object?>[doc];
  while (stack.isNotEmpty) {
    final v = stack.removeLast();
    if (v == null) {
      nulls++;
    } else if (v is String) {
      strLen += v.length;
    } else if (v is int) {
      intSum += v;
    } else if (v == true) {
      trues++;
    } else if (v is List) {
      stack.addAll(v);
    } else if (v is Map) {
      objects++;
      stack.addAll(v.values);
    }
  }
  return <int>[objects, intSum, strLen, trues, nulls];
}

List<int> emit(Object? res) => res as List<int>;
