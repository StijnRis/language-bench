"use strict";

const n = parseInt(process.argv[2], 10);
let x = 1;
const a = new Int32Array(n);
for (let i = 0; i < n; i++) {
  x = (x * 48271) % 2147483647;
  a[i] = x;
}

a.sort();

let checksum = 0;
for (let i = 0; i < n; i++) checksum = (checksum + i * a[i]) % 1000000007;

console.log(`first=${a[0]}`);
console.log(`last=${a[n - 1]}`);
console.log(`median=${a[Math.floor(n / 2)]}`);
console.log(`checksum=${checksum}`);
