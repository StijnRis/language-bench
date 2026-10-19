// conformance problem: sum, maximum and a checksum of 4096 int32 values
export const setup = () => {};
export const decode = (data: Uint8Array) => new Int32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
export const solve = (a: Int32Array) => {
  let sum = 0, mx = 0, sq = 0;
  for (let i = 0; i < a.length; i++) {
    const v = a[i];
    sum += v;
    if (v > mx) mx = v;
    sq = (sq + v * v) % 1000003;
  }
  return [sum, mx, sq, a.length];
};
export const emit = (r: number[]) => r;
