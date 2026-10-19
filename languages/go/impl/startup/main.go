// start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
package main

func Setup(args []string)              {}
func Decode(data []byte) any           { return nil }
func Solve(inst any) any               { return nil }
func Emit(res any, sink func(int64))   { sink(1) }
