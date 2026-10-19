package main

import "strconv"

var nArg = 10000000

func Setup(args []string) {
	if len(args) > 0 {
		nArg, _ = strconv.Atoi(args[0])
	}
}

func Decode(data []byte) any { return nil }

func Solve(inst any) any {
	n := nArg
	composite := make([]bool, n+1)
	for p := 2; p*p <= n; p++ {
		if !composite[p] {
			for m := p * p; m <= n; m += p {
				composite[m] = true
			}
		}
	}
	var count, last, sum int64
	for i := 2; i <= n; i++ {
		if !composite[i] {
			count++
			last = int64(i)
			sum += int64(i)
		}
	}
	return []int64{count, last, sum}
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int64) {
		sink(v)
	}
}
