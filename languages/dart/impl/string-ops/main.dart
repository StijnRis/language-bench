import 'dart:convert';
import 'dart:typed_data';

void setup(List<String> args) {}

Object? decode(Uint8List data) => utf8.decode(data);

Object? solve(Object? inst) {
  final text = inst as String;
  final codepoints = text.runes.length;
  var spaces = 0;
  for (var i = 0; i < text.length; i++) {
    if (text.codeUnitAt(i) == 32) spaces++;
  }
  var needle = 0;
  for (var p = text.indexOf('er'); p != -1; p = text.indexOf('er', p + 2)) {
    needle++;
  }
  var checksum = 0;
  for (final b in utf8.encode(text.replaceAll(' ', '_'))) {
    checksum += b;
  }
  return <int>[utf8.encode(text).length, codepoints, spaces + 1, needle, checksum];
}

List<int> emit(Object? res) => res as List<int>;
