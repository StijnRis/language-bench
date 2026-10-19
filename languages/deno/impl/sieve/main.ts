const n = parseInt(Deno.args[0], 10);
const composite = new Uint8Array(n + 1);
for (let p = 2; p * p <= n; p++) {
  if (!composite[p]) {
    for (let m = p * p; m <= n; m += p) composite[m] = 1;
  }
}
let count = 0, last = 0, sum = 0;
for (let i = 2; i <= n; i++) {
  if (!composite[i]) {
    count++;
    last = i;
    sum += i;
  }
}
console.log(`count=${count}`);
console.log(`last=${last}`);
console.log(`sum=${sum}`);
