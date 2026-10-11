"use strict";

const n = parseInt(process.argv[2], 10);
let x = 1;
const next = () => (x = (x * 48271) % 2147483647);

const m = new Map();
for (let i = 0; i < n; i++) {
  const k = next() % Math.floor(n / 2);
  m.set(k, (m.get(k) ?? 0) + 1);
}

let checksum = 0;
for (const [k, c] of m) checksum += k * c;

let hits = 0;
for (let i = 0; i < n; i++) hits += m.get(next() % n) ?? 0;

console.log(`distinct=${m.size}`);
console.log(`checksum=${checksum}`);
console.log(`hits=${hits}`);
