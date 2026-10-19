// start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
module Problem

let setup (args: string[]) = ()
let decode (data: byte[]) : obj = null
let solve (inst: obj) : obj = null
let emit (res: obj) (sink: int64 -> unit) = sink 1L
let release (inst: obj) (res: obj) = ()
