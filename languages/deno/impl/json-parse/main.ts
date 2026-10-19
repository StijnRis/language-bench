const doc: unknown = JSON.parse(Deno.readTextFileSync(Deno.args[0]));

let objects = 0, intSum = 0, strLen = 0, trues = 0, nulls = 0;
const stack: unknown[] = [doc];
while (stack.length > 0) {
  const v = stack.pop();
  if (v === null) nulls++;
  else if (typeof v === "string") strLen += v.length;
  else if (typeof v === "number") intSum += v;
  else if (v === true) trues++;
  else if (Array.isArray(v)) for (const x of v) stack.push(x);
  else if (typeof v === "object") {
    objects++;
    for (const k in v) stack.push((v as Record<string, unknown>)[k]);
  }
}

console.log(`objects=${objects}`);
console.log(`int_sum=${intSum}`);
console.log(`string_length=${strLen}`);
console.log(`true=${trues}`);
console.log(`null=${nulls}`);
