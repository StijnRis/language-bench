import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

void setup(List<String> args) {}

Object? decode(Uint8List data) => utf8.decode(data); // path of the file

Object? solve(Object? inst) {
  final freq = <String, int>{};
  var lines = 0, total = 0;
  for (final line in File(inst as String).readAsLinesSync(encoding: latin1)) {
    final c1 = line.indexOf(',');
    final c2 = line.indexOf(',', c1 + 1);
    final word = line.substring(c1 + 1, c2);
    total += int.parse(line.substring(c2 + 1));
    freq[word] = (freq[word] ?? 0) + 1;
    lines++;
  }
  var top = '';
  var topCount = -1;
  freq.forEach((w, c) {
    if (c > topCount || (c == topCount && w.compareTo(top) < 0)) {
      top = w;
      topCount = c;
    }
  });
  return <int>[lines, total, freq.length, topCount, top.length, ...top.codeUnits];
}

List<int> emit(Object? res) => res as List<int>;
