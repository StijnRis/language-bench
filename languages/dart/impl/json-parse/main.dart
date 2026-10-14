import 'dart:convert';
import 'dart:io';

void main(List<String> args) {
  final doc = jsonDecode(File(args[0]).readAsStringSync());

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

  print('objects=$objects');
  print('int_sum=$intSum');
  print('string_length=$strLen');
  print('true=$trues');
  print('null=$nulls');
}
