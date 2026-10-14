"use strict";

const VOCAB = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
  "über", "résumé", "привет", "мир",
  "код", "日本語", "世界", "速度", "hello", "world",
];

const n = parseInt(process.argv[2], 10);
let x = 1;
const words = new Array(n);
for (let i = 0; i < n; i++) {
  x = (x * 48271) % 2147483647;
  words[i] = VOCAB[x % VOCAB.length];
}
const text = words.join(" ");

let codepoints = 0;
for (const _ of text) codepoints++;

let needle = 0;
for (let p = text.indexOf("er"); p !== -1; p = text.indexOf("er", p + 2)) needle++;

const bytes = Buffer.from(text.replaceAll(" ", "_"), "utf8");
let checksum = 0;
for (let i = 0; i < bytes.length; i++) checksum += bytes[i];

console.log(`bytes=${Buffer.byteLength(text, "utf8")}`);
console.log(`codepoints=${codepoints}`);
console.log(`words=${text.split(" ").length}`);
console.log(`needle=${needle}`);
console.log(`checksum=${checksum}`);
