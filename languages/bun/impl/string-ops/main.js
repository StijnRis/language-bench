"use strict";
exports.setup = () => {};
exports.decode = (data) => data.toString("utf8");
exports.solve = (text) => {
  let codepoints = 0;
  for (const _ of text) codepoints++;
  let spaces = 0;
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 32) spaces++;
  let needle = 0;
  for (let p = text.indexOf("er"); p !== -1; p = text.indexOf("er", p + 2)) needle++;
  const bytes = Buffer.from(text.replaceAll(" ", "_"), "utf8");
  let checksum = 0;
  for (let i = 0; i < bytes.length; i++) checksum += bytes[i];
  return [Buffer.byteLength(text, "utf8"), codepoints, spaces + 1, needle, checksum];
};
exports.emit = (r) => r;
