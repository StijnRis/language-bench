const n = parseInt(process.argv[2], 10);
const a = new Float64Array(n * n), b = new Float64Array(n * n), c = new Float64Array(n * n);
for (let i = 0; i < n; i++)
  for (let j = 0; j < n; j++) {
    a[i * n + j] = (i * 31 + j * 17) % 10 + 1;
    b[i * n + j] = (i * 13 + j * 7) % 10 - 4;
  }

for (let i = 0; i < n; i++)
  for (let k = 0; k < n; k++) {
    const aik = a[i * n + k];
    for (let j = 0; j < n; j++) c[i * n + j] += aik * b[k * n + j];
  }

let trace = 0, sum = 0;
for (let i = 0; i < n; i++) trace += c[i * n + i];
for (let i = 0; i < c.length; i++) sum += c[i];
console.log(`trace=${trace}`);
console.log(`sum=${sum}`);
console.log(`c00=${c[0]}`);
console.log(`clast=${c[n * n - 1]}`);
