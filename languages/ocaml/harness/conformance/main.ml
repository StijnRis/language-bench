(* conformance problem: sum, maximum and a checksum of 4096 int32 values *)
type instance = int array
type result = int list

let setup _ = ()
let decode s = Array.init (String.length s / 4) (fun i -> Int32.to_int (String.get_int32_le s (4 * i)))

let solve (a : instance) : result =
  let s = Array.fold_left ( + ) 0 a and m = Array.fold_left max 0 a in
  let sq = Array.fold_left (fun acc v -> (acc + (v * v)) mod 1000003) 0 a in
  [ s; m; sq; Array.length a ]

let emit (r : result) sink = List.iter sink r
