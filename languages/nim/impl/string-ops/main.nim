import std/[os, strutils, unicode]

const vocab = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
  "über", "résumé", "привет", "мир",
  "код", "日本語", "世界", "速度", "hello", "world",
]

let n = parseInt(paramStr(1))
var x = 1
var words = newSeq[string](n)
for i in 0 ..< n:
  x = x * 48271 mod 2147483647
  words[i] = vocab[x mod vocab.len]
let text = words.join(" ")

let encoded = text.replace(' ', '_')
var checksum = 0
for c in encoded: checksum += int(c)

echo "bytes=", text.len
echo "codepoints=", text.runeLen
echo "words=", text.count(' ') + 1
echo "needle=", text.count("er")
echo "checksum=", checksum
