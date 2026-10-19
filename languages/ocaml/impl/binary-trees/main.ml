(* Binary trees, after the Computer Language Benchmarks Game. *)
type tree = Leaf | Node of tree * tree
type instance = unit
type result = int list

let depth = ref 14
let setup args = if Array.length args > 0 then depth := int_of_string args.(0)
let decode _ = ()
let rec make d = if d = 0 then Leaf else Node (make (d - 1), make (d - 1))
let rec check = function Leaf -> 1 | Node (l, r) -> 1 + check l + check r

let solve () : result =
  let min_depth = 4 in
  let max_depth = max (min_depth + 2) !depth in
  let stretch = max_depth + 1 in
  let out = ref [ check (make stretch) ] in
  let long_lived = make max_depth in
  let d = ref min_depth in
  while !d <= max_depth do
    let iterations = 1 lsl (max_depth - !d + min_depth) in
    let sum = ref 0 in
    for _ = 1 to iterations do
      sum := !sum + check (make !d)
    done;
    out := !sum :: iterations :: !out;
    d := !d + 2
  done;
  List.rev (check long_lived :: !out)

let emit (r : result) sink = List.iter sink r
