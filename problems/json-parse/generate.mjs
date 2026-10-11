// Deterministic generator: node generate.mjs <outFile>
// Writes ~20 MB of ASCII JSON. Same output on every machine (MINSTD PRNG, integers only).
import fs from "node:fs";

let x = 12345;
const rnd = () => (x = (x * 48271) % 2147483647);
const pick = (a) => a[rnd() % a.length];

const words = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet", "kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango"];
const out = fs.openSync(process.argv[2], "w");
const RECORDS = 90000;
let buf = ["["];
let size = 0;
const flush = () => {
  const s = buf.join("");
  fs.writeSync(out, s);
  size += s.length;
  buf = [];
};
for (let i = 0; i < RECORDS; i++) {
  const ntags = rnd() % 6;
  const tags = Array.from({ length: ntags }, () => JSON.stringify(pick(words) + "-" + (rnd() % 1000)));
  const rec =
    `{"id":${i + 1},"name":${JSON.stringify(pick(words) + " " + pick(words) + " \\\"" + (rnd() % 100000) + "\\\"")},` +
    `"active":${rnd() % 3 !== 0},"score":${(rnd() % 2000000) - 1000000},"tags":[${tags.join(",")}],` +
    `"meta":{"x":${rnd() % 1000},"y":${rnd() % 1000},"note":${rnd() % 4 === 0 ? "null" : JSON.stringify(pick(words).repeat(1 + (rnd() % 8)))},` +
    `"history":[${Array.from({ length: rnd() % 12 }, () => rnd() % 100000).join(",")}]}}`;
  buf.push(rec, i === RECORDS - 1 ? "]\n" : ",\n");
  if (buf.length > 4096) flush();
}
flush();
fs.closeSync(out);
console.error(`json-parse input: ${size} bytes`);
