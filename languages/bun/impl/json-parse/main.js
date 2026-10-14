"use strict";
const fs = require("node:fs");

const doc = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

let objects = 0, intSum = 0, strLen = 0, trues = 0, nulls = 0;
const stack = [doc];
while (stack.length > 0) {
  const v = stack.pop();
  if (v === null) nulls++;
  else if (typeof v === "string") strLen += v.length;
  else if (typeof v === "number") intSum += v;
  else if (v === true) trues++;
  else if (Array.isArray(v)) for (const x of v) stack.push(x);
  else if (typeof v === "object") {
    objects++;
    for (const k in v) stack.push(v[k]);
  }
}

console.log(`objects=${objects}`);
console.log(`int_sum=${intSum}`);
console.log(`string_length=${strLen}`);
console.log(`true=${trues}`);
console.log(`null=${nulls}`);
