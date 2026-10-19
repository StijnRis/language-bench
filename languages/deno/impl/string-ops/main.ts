const VOCAB: string[] = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
  "über", "résumé", "привет", "мир",
  "код", "日本語", "世界", "速度", "hello", "world",
];

const n = parseInt(Deno.args[0], 10);
let x = 1;
const words: string[] = new Array(n);
for (let i = 0; i < n; i++) {
  x = (x * 48271) % 2147483647;
  words[i] = VOCAB[x % VOCAB.length];
}
const text = words.join(" ");

let codepoints = 0;
for (const _ of text) codepoints++;

let needle = 0;
for (let p = text.indexOf("er"); p !== -1; p = text.indexOf("er", p + 2)) needle++;

const encoder = new TextEncoder();
const bytes = encoder.encode(text.replaceAll(" ", "_"));
let checksum = 0;
for (let i = 0; i < bytes.length; i++) checksum += bytes[i];

console.log(`bytes=${encoder.encode(text).length}`);
console.log(`codepoints=${codepoints}`);
console.log(`words=${text.split(" ").length}`);
console.log(`needle=${needle}`);
console.log(`checksum=${checksum}`);
