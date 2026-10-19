// the instance is an Int32Array, sorted with its built-in typed-array sort
export const setup = () => {};
export const decode = (data: Uint8Array) => new Int32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
export const solve = (a) => a.sort();
export const emit = (a) => a;
