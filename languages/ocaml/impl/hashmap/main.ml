let () =
  let n = int_of_string Sys.argv.(1) in
  let x = ref 1 in
  let next () =
    x := !x * 48271 mod 2147483647;
    !x
  in
  let m : (int, int ref) Hashtbl.t = Hashtbl.create 1024 in
  let half = n / 2 in
  for _ = 1 to n do
    let k = next () mod half in
    match Hashtbl.find_opt m k with Some r -> incr r | None -> Hashtbl.add m k (ref 1)
  done;
  let checksum = Hashtbl.fold (fun k c acc -> acc + (k * !c)) m 0 in
  let hits = ref 0 in
  for _ = 1 to n do
    match Hashtbl.find_opt m (next () mod n) with Some r -> hits := !hits + !r | None -> ()
  done;
  Printf.printf "distinct=%d\nchecksum=%d\nhits=%d\n" (Hashtbl.length m) checksum !hits
