(* Binary trees, after the Computer Language Benchmarks Game. *)
type tree = Leaf | Node of tree * tree

let rec make d = if d = 0 then Leaf else Node (make (d - 1), make (d - 1))

let rec check = function Leaf -> 1 | Node (l, r) -> 1 + check l + check r

let () =
  let n = int_of_string Sys.argv.(1) in
  let min_depth = 4 in
  let max_depth = max (min_depth + 2) n in
  let stretch = max_depth + 1 in
  Printf.printf "stretch tree of depth %d\t check: %d\n" stretch (check (make stretch));
  let long_lived = make max_depth in
  let depth = ref min_depth in
  while !depth <= max_depth do
    let iterations = 1 lsl (max_depth - !depth + min_depth) in
    let sum = ref 0 in
    for _ = 1 to iterations do
      sum := !sum + check (make !depth)
    done;
    Printf.printf "%d\t trees of depth %d\t check: %d\n" iterations !depth !sum;
    depth := !depth + 2
  done;
  Printf.printf "long lived tree of depth %d\t check: %d\n" max_depth (check long_lived)
