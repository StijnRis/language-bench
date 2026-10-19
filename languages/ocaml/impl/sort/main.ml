let () =
  let n = int_of_string Sys.argv.(1) in
  let x = ref 1 in
  let a =
    Array.init n (fun _ ->
        x := !x * 48271 mod 2147483647;
        !x)
  in
  (* Array.stable_sort is the merge sort of the standard library (faster than Array.sort, a heap sort) *)
  Array.stable_sort (fun (p : int) q -> compare p q) a;
  let checksum = ref 0 in
  for i = 0 to n - 1 do
    checksum := (!checksum + (i * a.(i))) mod 1000000007
  done;
  Printf.printf "first=%d\nlast=%d\nmedian=%d\nchecksum=%d\n" a.(0) a.(n - 1) a.(n / 2) !checksum
