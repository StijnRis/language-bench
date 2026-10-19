(* Workers are processes (Unix.fork + a pipe each), like the Python, Ruby, PHP and Perl versions:
   it works unchanged on every OCaml version. *)
let is_prime n =
  if n < 2 then false
  else if n < 4 then true
  else if n mod 2 = 0 then false
  else begin
    let d = ref 3 and prime = ref true in
    while !prime && !d * !d <= n do
      if n mod !d = 0 then prime := false;
      d := !d + 2
    done;
    !prime
  end

let () =
  let n = int_of_string Sys.argv.(1) and workers = int_of_string Sys.argv.(2) in
  let readers =
    List.init workers (fun t ->
        let rd, wr = Unix.pipe () in
        match Unix.fork () with
        | 0 ->
            Unix.close rd;
            let count = ref 0 in
            let i = ref t in
            while !i < n do
              if is_prime !i then incr count;
              i := !i + workers
            done;
            let oc = Unix.out_channel_of_descr wr in
            output_string oc (string_of_int !count ^ "\n");
            close_out oc;
            exit 0
        | _ ->
            Unix.close wr;
            rd)
  in
  let total =
    List.fold_left
      (fun acc rd ->
        let ic = Unix.in_channel_of_descr rd in
        let c = int_of_string (input_line ic) in
        close_in ic;
        acc + c)
      0 readers
  in
  for _ = 1 to workers do ignore (Unix.wait ()) done;
  Printf.printf "primes=%d\n" total
