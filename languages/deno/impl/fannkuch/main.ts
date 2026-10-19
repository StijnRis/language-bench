let nArg = 9;
export const setup = (args) => {
  if (args.length) nArg = parseInt(args[0], 10);
};
export const decode = () => null;
export const solve = () => {
  const n = nArg;
  const perm1 = new Int32Array(n), perm = new Int32Array(n), count = new Int32Array(n);
  for (let i = 0; i < n; i++) perm1[i] = i;
  let maxflips = 0, permcount = 0, r = n, checksum = 0;
  for (;;) {
    while (r !== 1) {
      count[r - 1] = r;
      r--;
    }
    perm.set(perm1);
    let flips = 0, k;
    while ((k = perm[0]) !== 0) {
      for (let i = 0, j = k; i < j; i++, j--) {
        const t = perm[i];
        perm[i] = perm[j];
        perm[j] = t;
      }
      flips++;
    }
    if (flips > maxflips) maxflips = flips;
    checksum += permcount % 2 === 0 ? flips : -flips;
    for (;;) {
      if (r === n) return [checksum, maxflips];
      const p0 = perm1[0];
      for (let i = 0; i < r; i++) perm1[i] = perm1[i + 1];
      perm1[r] = p0;
      if (--count[r] > 0) break;
      r++;
    }
    permcount++;
  }
};
export const emit = (r) => r;
