import 'dart:typed_data';

void main(List<String> args) {
  final n = int.parse(args[0]);
  final a = Float64List(n * n);
  final b = Float64List(n * n);
  final c = Float64List(n * n);
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      a[i * n + j] = ((i * 31 + j * 17) % 10 + 1).toDouble();
      b[i * n + j] = ((i * 13 + j * 7) % 10 - 4).toDouble();
    }
  }

  for (var i = 0; i < n; i++) {
    for (var k = 0; k < n; k++) {
      final aik = a[i * n + k];
      for (var j = 0; j < n; j++) {
        c[i * n + j] += aik * b[k * n + j];
      }
    }
  }

  var trace = 0.0, sum = 0.0;
  for (var i = 0; i < n; i++) {
    trace += c[i * n + i];
  }
  for (var i = 0; i < c.length; i++) {
    sum += c[i];
  }
  print('trace=${trace.toInt()}');
  print('sum=${sum.toInt()}');
  print('c00=${c[0].toInt()}');
  print('clast=${c[n * n - 1].toInt()}');
}
