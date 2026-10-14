import 'dart:convert';
import 'dart:io';

void main(List<String> args) {
  final freq = <String, int>{};
  var lines = 0;
  var total = 0;
  for (final line in File(args[0]).readAsLinesSync(encoding: latin1)) {
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

  print('lines=$lines');
  print('sum=$total');
  print('distinct=${freq.length}');
  print('top=$top $topCount');
}
