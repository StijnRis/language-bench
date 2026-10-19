type instance = string
type result = int list

let setup _ = ()
let decode s = s

let solve (text : instance) : result =
  let len = String.length text in
  (* OCaml strings are bytes: code points are the bytes that are not UTF-8 continuation bytes *)
  let codepoints = ref 0 and spaces = ref 0 and checksum = ref 0 in
  for i = 0 to len - 1 do
    let c = Char.code (String.unsafe_get text i) in
    if c land 0xC0 <> 0x80 then incr codepoints;
    if c = 32 then (incr spaces; checksum := !checksum + 95) else checksum := !checksum + c
  done;
  let needle = ref 0 and i = ref 0 in
  while !i < len - 1 do
    if String.unsafe_get text !i = 'e' && String.unsafe_get text (!i + 1) = 'r' then (incr needle; i := !i + 2) else incr i
  done;
  [ len; !codepoints; !spaces + 1; !needle; !checksum ]

let emit (r : result) sink = List.iter sink r
