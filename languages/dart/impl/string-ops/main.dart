import 'dart:convert';

const vocab = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'naïve', 'café',
  'über', 'résumé', 'привет', 'мир',
  'код', '日本語', '世界', '速度', 'hello', 'world',
];

void main(List<String> args) {
  final n = int.parse(args[0]);
  var x = 1;
  final words = List<String>.filled(n, '');
  for (var i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    words[i] = vocab[x % vocab.length];
  }
  final text = words.join(' ');

  final codepoints = text.runes.length;

  var needle = 0;
  for (var p = text.indexOf('er'); p != -1; p = text.indexOf('er', p + 2)) {
    needle++;
  }

  final bytes = utf8.encode(text.replaceAll(' ', '_'));
  var checksum = 0;
  for (final b in bytes) {
    checksum += b;
  }

  print('bytes=${utf8.encode(text).length}');
  print('codepoints=$codepoints');
  print('words=${text.split(' ').length}');
  print('needle=$needle');
  print('checksum=$checksum');
}
