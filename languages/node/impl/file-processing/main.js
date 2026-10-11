"use strict";
const fs = require("node:fs");

const text = fs.readFileSync(process.argv[2], "latin1");
const freq = new Map();
let lines = 0;
let total = 0;

let pos = 0;
while (pos < text.length) {
  let end = text.indexOf("\n", pos);
  if (end === -1) end = text.length;
  const line = text.slice(pos, end);
  pos = end + 1;
  const c1 = line.indexOf(",");
  const c2 = line.indexOf(",", c1 + 1);
  const word = line.slice(c1 + 1, c2);
  total += parseInt(line.slice(c2 + 1), 10);
  freq.set(word, (freq.get(word) ?? 0) + 1);
  lines++;
}

let top = null;
let topCount = -1;
for (const [w, c] of freq) {
  if (c > topCount || (c === topCount && w < top)) {
    top = w;
    topCount = c;
  }
}

console.log(`lines=${lines}`);
console.log(`sum=${total}`);
console.log(`distinct=${freq.size}`);
console.log(`top=${top} ${topCount}`);
