"use strict";
// conformance problem: sum, maximum and a checksum of 4096 int32 values
exports.setup = () => {};
exports.decode = (data) => new Int32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
exports.solve = (a) => {
  let sum = 0, mx = 0, sq = 0;
  for (let i = 0; i < a.length; i++) {
    const v = a[i];
    sum += v;
    if (v > mx) mx = v;
    sq = (sq + v * v) % 1000003;
  }
  return [sum, mx, sq, a.length];
};
exports.emit = (r) => r;
