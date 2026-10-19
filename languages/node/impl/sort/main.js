"use strict";
// the instance is an Int32Array, sorted with its built-in typed-array sort
exports.setup = () => {};
exports.decode = (data) => new Int32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
exports.solve = (a) => a.sort();
exports.emit = (a) => a;
