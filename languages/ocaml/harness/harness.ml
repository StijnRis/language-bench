(* language-bench harness for OCaml: see harness/CONTRACT.md. Compiled after problem.ml, which provides
   setup, decode, solve and emit (instance and result types stay the problem's own).
   The standard library has no monotonic clock, so time is Unix.gettimeofday (microsecond resolution). *)
let num k d = match Sys.getenv_opt k with Some s when s <> "" -> (try float_of_string s with _ -> d) | _ -> d
let env k d = match Sys.getenv_opt k with Some s when s <> "" -> s | _ -> d
let now () = int_of_float (Unix.gettimeofday () *. 1e9 +. 0.5)

let read_exact n =
  try really_input_string stdin n
  with End_of_file ->
    prerr_endline "harness: input ended early";
    exit 1

let p1 = 2147483647
let p2 = 2147483629
let h1 = ref 0
let h2 = ref 0
let nwords = ref 0

let mix w =
  let m1 = ((w mod p1) + p1) mod p1 and m2 = ((w mod p2) + p2) mod p2 in
  h1 := ((!h1 * 1000003) + m1) mod p1;
  h2 := ((!h2 * 999983) + m2) mod p2

let sink w = mix w; incr nwords

let () =
  set_binary_mode_in stdin true;
  let input = env "LB_INPUT" "none" in
  let budget = num "LB_BUDGET_SECONDS" 10. *. 1e9 in
  let min_iters = int_of_float (num "LB_MIN_ITERS" 3.) and max_iters = int_of_float (num "LB_MAX_ITERS" 0.) in
  let start = int_of_float (num "LB_START" 0.) in
  let gen = env "LB_GEN" "/usr/local/bin/lbgen" and file = env "LB_FILE" "/dev/shm/lb-input" and pname = env "LB_PROBLEM" "" in
  let file_ready = Sys.getenv_opt "LB_FILE_READY" <> None in
  Problem.setup (Array.sub Sys.argv 1 (Array.length Sys.argv - 1));
  let rows = ref [] and iters = ref 0 and kernel = ref 0. and reason = ref "budget" in
  let mono0 = now () in
  let wall0 = mono0 in
  let fin = ref false in
  while not !fin do
    let inst =
      match input with
      | "stream" ->
          let hdr = read_exact 8 in
          let len = Int64.to_int (String.get_int64_le hdr 0) in
          Problem.decode (read_exact len)
      | "file" ->
          if not file_ready then begin
            let cmd = Printf.sprintf "%s file %s %d %s" (Filename.quote gen) pname (start + !iters) (Filename.quote file) in
            if Sys.command cmd <> 0 then (prerr_endline "harness: generator failed"; exit 1)
          end;
          Problem.decode file
      | _ -> Problem.decode ""
    in
    let t0 = now () in
    let res = Problem.solve inst in
    let t1 = now () in
    h1 := 17; h2 := 19; nwords := 0;
    Problem.emit res sink;
    mix !nwords;
    if input = "file" && not file_ready then (try Sys.remove file with _ -> ());
    rows := (t0, t1, !h1, !h2) :: !rows;
    incr iters;
    kernel := !kernel +. float_of_int (t1 - t0);
    if max_iters > 0 && !iters >= max_iters then (reason := "iters"; fin := true)
    else if !kernel >= budget && !iters >= min_iters then fin := true
  done;
  let b = Buffer.create 4096 in
  Buffer.add_string b (Printf.sprintf "LB 1 clock=Unix.gettimeofday\nSTART mono=%d wall=%d\n" mono0 wall0);
  List.iteri (fun i (t0, t1, a, c) -> Buffer.add_string b (Printf.sprintf "ITER %d t0=%d t1=%d check=%d:%d\n" (i + 1) t0 t1 a c)) (List.rev !rows);
  Buffer.add_string b (Printf.sprintf "DONE iters=%d kernel_ns=%d reason=%s\n" !iters (int_of_float !kernel) !reason);
  print_string (Buffer.contents b);
  flush stdout
