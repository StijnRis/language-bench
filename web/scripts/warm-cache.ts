// Computes the statistics once before `next build`, so its worker processes can read them from disk.
import { getModel } from "../lib/model";

console.time("analysis");
getModel();
console.timeEnd("analysis");
