type instance = int * float array * float array
type result = int * float array

let setup _ = ()

let decode s =
  let n = Int32.to_int (String.get_int32_le s 0) in
  let get off = Array.init (n * n) (fun i -> Int64.float_of_bits (String.get_int64_le s (4 + (8 * (off + i))))) in
  (n, get 0, get (n * n))

let solve ((n, a, b) : instance) : result =
  let c = Array.make (n * n) 0.0 in
  for i = 0 to n - 1 do
    for k = 0 to n - 1 do
      let aik = a.((i * n) + k) in
      for j = 0 to n - 1 do
        c.((i * n) + j) <- c.((i * n) + j) +. (aik *. b.((k * n) + j))
      done
    done
  done;
  (n, c)

let emit ((_, c) : result) sink = Array.iter (fun v -> sink (int_of_float (Float.floor (v +. 0.5)))) c
