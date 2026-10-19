let () =
  let n = int_of_string Sys.argv.(1) in
  let composite = Bytes.make (n + 1) '\000' in
  let p = ref 2 in
  while !p * !p <= n do
    if Bytes.unsafe_get composite !p = '\000' then begin
      let m = ref (!p * !p) in
      while !m <= n do
        Bytes.unsafe_set composite !m '\001';
        m := !m + !p
      done
    end;
    incr p
  done;
  let count = ref 0 and last = ref 0 and sum = ref 0 in
  for i = 2 to n do
    if Bytes.unsafe_get composite i = '\000' then begin
      incr count;
      last := i;
      sum := !sum + i
    end
  done;
  Printf.printf "count=%d\nlast=%d\nsum=%d\n" !count !last !sum
