type instance = int array * int array
type result = int list

let setup _ = ()

let decode s =
  let n = String.length s / 8 in
  let get off = Array.init n (fun i -> Int32.to_int (String.get_int32_le s (4 * (off + i)))) in
  (get 0, get n)

let solve ((keys, lookups) : instance) : result =
  let m : (int, int ref) Hashtbl.t = Hashtbl.create 1024 in
  Array.iter (fun k -> match Hashtbl.find_opt m k with Some r -> incr r | None -> Hashtbl.add m k (ref 1)) keys;
  let checksum = Hashtbl.fold (fun k c acc -> acc + (k * !c)) m 0 in
  let hits = ref 0 in
  Array.iter (fun k -> match Hashtbl.find_opt m k with Some r -> hits := !hits + !r | None -> ()) lookups;
  [ Hashtbl.length m; checksum; !hits ]

let emit (r : result) sink = List.iter sink r
