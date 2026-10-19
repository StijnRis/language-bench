# start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
type
  Instance* = int
  Result* = int

proc setup*(args: seq[string]) = discard
proc decode*(data: string): Instance = 0
proc solve*(inst: var Instance): Result = 0
proc emit*(r: Result, sink: proc (w: int)) = sink(1)
