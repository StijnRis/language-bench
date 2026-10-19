"use strict";
exports.setup = () => {};
exports.decode = (data) => data; // the bytes are parsed inside solve
exports.solve = (data) => {
  const doc = JSON.parse(data.toString("utf8"));
  let objects = 0, intSum = 0, strLen = 0, trues = 0, nulls = 0;
  const stack = [doc];
  while (stack.length > 0) {
    const v = stack.pop();
    if (v === null) nulls++;
    else if (typeof v === "string") strLen += v.length;
    else if (typeof v === "number") intSum += v;
    else if (v === true) trues++;
    else if (Array.isArray(v)) for (const x of v) stack.push(x);
    else if (typeof v === "object") {
      objects++;
      for (const k in v) stack.push(v[k]);
    }
  }
  return [objects, intSum, strLen, trues, nulls];
};
exports.emit = (r) => r;
