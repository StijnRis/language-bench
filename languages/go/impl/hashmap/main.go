package main

import "encoding/binary"

type hashInstance struct{ keys, lookups []uint32 }

func Setup(args []string) {}

func Decode(data []byte) any {
	n := len(data) / 8
	in := hashInstance{make([]uint32, n), make([]uint32, n)}
	for i := 0; i < n; i++ {
		in.keys[i] = binary.LittleEndian.Uint32(data[4*i:])
		in.lookups[i] = binary.LittleEndian.Uint32(data[4*(n+i):])
	}
	return in
}

func Solve(inst any) any {
	in := inst.(hashInstance)
	m := make(map[uint32]int64)
	for _, k := range in.keys {
		m[k]++
	}
	var checksum int64
	for k, c := range m {
		checksum += int64(k) * c
	}
	var hits int64
	for _, k := range in.lookups {
		hits += m[k]
	}
	return []int64{int64(len(m)), checksum, hits}
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int64) {
		sink(v)
	}
}
