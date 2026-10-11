// Deterministic generator: node generate.mjs <outFile>
// Writes a ~50 MB CSV "id,word,value". Same output on every machine.
import fs from "node:fs";

let x = 987654321;
const rnd = () => (x = (x * 48271) % 2147483647);

const syll = ["ka", "to", "mi", "re", "su", "no", "ha", "li", "ve", "do", "an", "or", "el", "um", "ix"];
const vocab = Array.from({ length: 5000 }, (_, i) => {
  let w = "";
  let n = i + 7;
  for (let k = 0; k < 3 + (i % 3); k++) {
    w += syll[n % syll.length];
    n = Math.floor(n / 3) + k * 5 + 1;
  }
  return w + i; // index suffix keeps all 5000 words distinct
});

const LINES = 1900000;
const out = fs.openSync(process.argv[2], "w");
let parts = [];
let size = 0;
for (let i = 1; i <= LINES; i++) {
  // squaring a uniform value skews usage towards low indices (Zipf-ish)
  const u = (rnd() % 100000) / 100000;
  const w = vocab[Math.floor(u * u * vocab.length)];
  parts.push(`${i},${w},${rnd() % 100000}\n`);
  if (parts.length >= 8192) {
    const s = parts.join("");
    fs.writeSync(out, s);
    size += s.length;
    parts = [];
  }
}
const s = parts.join("");
fs.writeSync(out, s);
size += s.length;
fs.closeSync(out);
console.error(`file-processing input: ${size} bytes`);
