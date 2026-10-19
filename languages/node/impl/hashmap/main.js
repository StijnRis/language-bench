"use strict";
exports.setup = () => {};
exports.decode = (data) => {
  const all = new Int32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
  const n = all.length / 2;
  return [all.subarray(0, n), all.subarray(n)];
};
exports.solve = ([keys, lookups]) => {
  const m = new Map();
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  let checksum = 0;
  for (const [k, c] of m) checksum += k * c;
  let hits = 0;
  for (let i = 0; i < lookups.length; i++) hits += m.get(lookups[i]) ?? 0;
  return [m.size, checksum, hits];
};
exports.emit = (r) => r;
