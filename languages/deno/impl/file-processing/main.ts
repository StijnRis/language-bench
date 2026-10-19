export const setup = () => {};
export const decode = (data: Uint8Array) => new TextDecoder().decode(data); // path of the file
export const solve = (path) => {
  const text = new TextDecoder("latin1").decode(Deno.readFileSync(path));
  const freq = new Map();
  let lines = 0, total = 0, pos = 0;
  while (pos < text.length) {
    let end = text.indexOf("\n", pos);
    if (end === -1) end = text.length;
    const line = text.slice(pos, end);
    pos = end + 1;
    const c1 = line.indexOf(",");
    const c2 = line.indexOf(",", c1 + 1);
    const word = line.slice(c1 + 1, c2);
    total += parseInt(line.slice(c2 + 1), 10);
    freq.set(word, (freq.get(word) ?? 0) + 1);
    lines++;
  }
  let top = null, topCount = -1;
  for (const [w, c] of freq) {
    if (c > topCount || (c === topCount && w < top)) {
      top = w;
      topCount = c;
    }
  }
  return [lines, total, freq.size, topCount, top];
};
export const emit = ([lines, total, distinct, count, word]) => [lines, total, distinct, count, word.length, ...Array.from(word, (c) => c.charCodeAt(0))];
