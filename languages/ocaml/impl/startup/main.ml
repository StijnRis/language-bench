(* start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem *)
type instance = unit
type result = unit

let setup _ = ()
let decode _ = ()
let solve () = ()
let emit () sink = sink 1
