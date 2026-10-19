(* The OCaml standard library has no JSON parser (yojson is a separate opam package), so this is a
   small recursive-descent parser. *)
type value =
  | Obj of value list
  | Arr of value list
  | Str of int (* length in characters *)
  | Num of int
  | Bool of bool
  | Null

type instance = string
type result = int list

let setup _ = ()
let decode s = s

let solve (s : instance) : result =
  let len = String.length s in
  let pos = ref 0 in
  let skip () =
    while !pos < len && (let c = String.unsafe_get s !pos in c = ' ' || c = '\n' || c = '\r' || c = '\t') do
      incr pos
    done
  in
  let parse_string () =
    incr pos;
    let n = ref 0 in
    while String.unsafe_get s !pos <> '"' do
      if String.unsafe_get s !pos = '\\' then (if String.unsafe_get s (!pos + 1) = 'u' then pos := !pos + 6 else pos := !pos + 2)
      else incr pos;
      incr n
    done;
    incr pos;
    !n
  in
  let rec parse_value () =
    skip ();
    match String.unsafe_get s !pos with
    | '{' ->
        incr pos;
        skip ();
        if s.[!pos] = '}' then (incr pos; Obj [])
        else begin
          let items = ref [] and fin = ref false in
          while not !fin do
            skip ();
            ignore (parse_string ());
            skip ();
            incr pos;
            items := parse_value () :: !items;
            skip ();
            let c = s.[!pos] in
            incr pos;
            if c = '}' then fin := true
          done;
          Obj !items
        end
    | '[' ->
        incr pos;
        skip ();
        if s.[!pos] = ']' then (incr pos; Arr [])
        else begin
          let items = ref [] and fin = ref false in
          while not !fin do
            items := parse_value () :: !items;
            skip ();
            let c = s.[!pos] in
            incr pos;
            if c = ']' then fin := true
          done;
          Arr !items
        end
    | '"' -> Str (parse_string ())
    | 't' -> pos := !pos + 4; Bool true
    | 'f' -> pos := !pos + 5; Bool false
    | 'n' -> pos := !pos + 4; Null
    | _ ->
        let neg = s.[!pos] = '-' in
        if neg then incr pos;
        let v = ref 0 in
        while !pos < len && (let c = String.unsafe_get s !pos in c >= '0' && c <= '9') do
          v := (!v * 10) + (Char.code (String.unsafe_get s !pos) - 48);
          incr pos
        done;
        Num (if neg then - !v else !v)
  in
  let doc = parse_value () in
  let objects = ref 0 and int_sum = ref 0 and str_len = ref 0 and trues = ref 0 and nulls = ref 0 in
  let stack = ref [ doc ] in
  let rec loop () =
    match !stack with
    | [] -> ()
    | v :: rest ->
        stack := rest;
        (match v with
        | Obj vs -> incr objects; stack := List.rev_append vs !stack
        | Arr vs -> stack := List.rev_append vs !stack
        | Str l -> str_len := !str_len + l
        | Num x -> int_sum := !int_sum + x
        | Bool true -> incr trues
        | Bool false -> ()
        | Null -> incr nulls);
        loop ()
  in
  loop ();
  [ !objects; !int_sum; !str_len; !trues; !nulls ]

let emit (r : result) sink = List.iter sink r
