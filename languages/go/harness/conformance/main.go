// conformance problem: sum, maximum and a checksum of 4096 int32 values
package main

import "encoding/binary"

func Setup(args []string) {}

func Decode(data []byte) any {
	a := make([]int32, len(data)/4)
	for i := range a {
		a[i] = int32(binary.LittleEndian.Uint32(data[4*i:]))
	}
	return a
}

func Solve(inst any) any {
	var sum, mx, sq int64
	a := inst.([]int32)
	for _, x := range a {
		v := int64(x)
		sum += v
		if v > mx {
			mx = v
		}
		sq = (sq + v*v) % 1000003
	}
	return []int64{sum, mx, sq, int64(len(a))}
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int64) {
		sink(v)
	}
}
