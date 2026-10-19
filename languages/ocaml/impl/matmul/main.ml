let () =
  let n = int_of_string Sys.argv.(1) in
  let a = Array.make (n * n) 0.0 and b = Array.make (n * n) 0.0 and c = Array.make (n * n) 0.0 in
  for i = 0 to n - 1 do
    for j = 0 to n - 1 do
      a.((i * n) + j) <- float_of_int ((((i * 31) + (j * 17)) mod 10) + 1);
      b.((i * n) + j) <- float_of_int ((((i * 13) + (j * 7)) mod 10) - 4)
    done
  done;
  for i = 0 to n - 1 do
    for k = 0 to n - 1 do
      let aik = a.((i * n) + k) in
      for j = 0 to n - 1 do
        c.((i * n) + j) <- c.((i * n) + j) +. (aik *. b.((k * n) + j))
      done
    done
  done;
  let trace = ref 0.0 and sum = ref 0.0 in
  for i = 0 to n - 1 do
    trace := !trace +. c.((i * n) + i)
  done;
  Array.iter (fun v -> sum := !sum +. v) c;
  Printf.printf "trace=%d\nsum=%d\nc00=%d\nclast=%d\n" (int_of_float !trace) (int_of_float !sum)
    (int_of_float c.(0)) (int_of_float c.((n * n) - 1))
