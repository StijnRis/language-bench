package main

import (
	"encoding/binary"
	"slices"
)

func Setup(args []string) {}

func Decode(data []byte) any {
	a := make([]int32, len(data)/4)
	for i := range a {
		a[i] = int32(binary.LittleEndian.Uint32(data[4*i:]))
	}
	return a
}

func Solve(inst any) any {
	a := inst.([]int32)
	slices.Sort(a)
	return a
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int32) {
		sink(int64(v))
	}
}
