let () =
  let ic = open_in_bin Sys.argv.(1) in
  let freq : (string, int ref) Hashtbl.t = Hashtbl.create 8192 in
  let lines = ref 0 and total = ref 0 in
  (try
     while true do
       let line = input_line ic in
       let c1 = String.index line ',' in
       let c2 = String.index_from line (c1 + 1) ',' in
       let word = String.sub line (c1 + 1) (c2 - c1 - 1) in
       total := !total + int_of_string (String.sub line (c2 + 1) (String.length line - c2 - 1));
       incr lines;
       match Hashtbl.find_opt freq word with
       | Some r -> incr r
       | None -> Hashtbl.add freq word (ref 1)
     done
   with End_of_file -> ());
  close_in ic;
  let top = ref "" and top_count = ref (-1) in
  Hashtbl.iter
    (fun w c ->
      if !c > !top_count || (!c = !top_count && compare w !top < 0) then begin
        top := w;
        top_count := !c
      end)
    freq;
  Printf.printf "lines=%d\nsum=%d\ndistinct=%d\ntop=%s %d\n" !lines !total (Hashtbl.length freq) !top !top_count
