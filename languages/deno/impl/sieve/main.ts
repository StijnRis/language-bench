let nArg = 10000000;
export const setup = (args) => {
  if (args.length) nArg = parseInt(args[0], 10);
};
export const decode = () => null;
export const solve = () => {
  const n = nArg;
  const composite = new Uint8Array(n + 1);
  for (let p = 2; p * p <= n; p++)
    if (!composite[p])
      for (let m = p * p; m <= n; m += p) composite[m] = 1;
  let count = 0, last = 0, sum = 0;
  for (let i = 2; i <= n; i++)
    if (!composite[i]) {
      count++;
      last = i;
      sum += i;
    }
  return [count, last, sum];
};
export const emit = (r) => r;
