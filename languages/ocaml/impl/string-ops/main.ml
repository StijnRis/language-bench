let vocab =
  [| "the"; "quick"; "brown"; "fox"; "jumps"; "over"; "lazy"; "dog"; "naïve"; "café";
     "über"; "résumé"; "привет"; "мир";
     "код"; "日本語"; "世界"; "速度"; "hello"; "world" |]

let () =
  let n = int_of_string Sys.argv.(1) in
  let x = ref 1 in
  let buf = Buffer.create (n * 8) in
  for i = 0 to n - 1 do
    x := !x * 48271 mod 2147483647;
    if i > 0 then Buffer.add_char buf ' ';
    Buffer.add_string buf vocab.(!x mod Array.length vocab)
  done;
  let text = Buffer.contents buf in
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
  Printf.printf "bytes=%d\ncodepoints=%d\nwords=%d\nneedle=%d\nchecksum=%d\n" len !codepoints (!spaces + 1) !needle !checksum
