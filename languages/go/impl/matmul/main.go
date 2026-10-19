package main

import (
	"encoding/binary"
	"math"
)

type matInstance struct {
	n    int
	a, b []float64
}

func Setup(args []string) {}

func Decode(data []byte) any {
	n := int(binary.LittleEndian.Uint32(data))
	read := func(off int) []float64 {
		f := make([]float64, n*n)
		for i := range f {
			f[i] = math.Float64frombits(binary.LittleEndian.Uint64(data[off+8*i:]))
		}
		return f
	}
	return matInstance{n, read(4), read(4 + 8*n*n)}
}

func Solve(inst any) any {
	in := inst.(matInstance)
	n := in.n
	c := make([]float64, n*n)
	for i := 0; i < n; i++ {
		ci := c[i*n : (i+1)*n]
		for k := 0; k < n; k++ {
			aik := in.a[i*n+k]
			bk := in.b[k*n : (k+1)*n]
			for j := range ci {
				ci[j] += aik * bk[j]
			}
		}
	}
	return c
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]float64) {
		sink(int64(math.Floor(v + 0.5)))
	}
}
