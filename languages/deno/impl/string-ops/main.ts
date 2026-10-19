export const setup = () => {};
export const decode = (data: Uint8Array) => new TextDecoder().decode(data);
export const solve = (text) => {
  let codepoints = 0;
  for (const _ of text) codepoints++;
  let spaces = 0;
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 32) spaces++;
  let needle = 0;
  for (let p = text.indexOf("er"); p !== -1; p = text.indexOf("er", p + 2)) needle++;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text.replaceAll(" ", "_"));
  let checksum = 0;
  for (let i = 0; i < bytes.length; i++) checksum += bytes[i];
  return [encoder.encode(text).length, codepoints, spaces + 1, needle, checksum];
};
export const emit = (r) => r;
