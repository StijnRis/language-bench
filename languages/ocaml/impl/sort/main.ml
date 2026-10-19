type instance = int array
type result = int array

let setup _ = ()
let decode s = Array.init (String.length s / 4) (fun i -> Int32.to_int (String.get_int32_le s (4 * i)))

(* Array.stable_sort is the merge sort of the standard library (faster than Array.sort, a heap sort) *)
let solve (a : instance) : result =
  Array.stable_sort (fun (p : int) q -> compare p q) a;
  a

let emit (r : result) sink = Array.iter sink r
