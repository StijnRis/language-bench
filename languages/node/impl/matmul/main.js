"use strict";
exports.setup = () => {};
exports.decode = (data) => {
  const n = data.readInt32LE(0);
  const f = new Float64Array(data.buffer.slice(data.byteOffset + 4, data.byteOffset + 4 + 16 * n * n));
  return { n, a: f.subarray(0, n * n), b: f.subarray(n * n) };
};
exports.solve = ({ n, a, b }) => {
  const c = new Float64Array(n * n);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < n; k++) {
      const aik = a[i * n + k];
      for (let j = 0; j < n; j++) c[i * n + j] += aik * b[k * n + j];
    }
  return c;
};
exports.emit = (c) => {
  const out = new Array(c.length);
  for (let i = 0; i < c.length; i++) out[i] = Math.floor(c[i] + 0.5);
  return out;
};
