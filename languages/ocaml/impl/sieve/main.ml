type instance = unit
type result = int list

let n = ref 10000000
let setup args = if Array.length args > 0 then n := int_of_string args.(0)
let decode _ = ()

let solve () : result =
  let n = !n in
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
  [ !count; !last; !sum ]

let emit (r : result) sink = List.iter sink r
