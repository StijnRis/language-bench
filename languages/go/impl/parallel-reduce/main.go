package main

import (
	"strconv"
	"sync"
)

var nArg, workersArg = 2000000, 4

func isPrime(n int) bool {
	if n < 2 {
		return false
	}
	if n < 4 {
		return true
	}
	if n%2 == 0 {
		return false
	}
	for d := 3; d*d <= n; d += 2 {
		if n%d == 0 {
			return false
		}
	}
	return true
}

func Setup(args []string) {
	if len(args) > 1 {
		nArg, _ = strconv.Atoi(args[0])
		workersArg, _ = strconv.Atoi(args[1])
	}
}

func Decode(data []byte) any { return nil }

func Solve(inst any) any {
	n, workers := nArg, workersArg
	counts := make([]int64, workers)
	var wg sync.WaitGroup
	for t := 0; t < workers; t++ {
		wg.Add(1)
		go func(t int) {
			defer wg.Done()
			var c int64
			for i := t; i < n; i += workers {
				if isPrime(i) {
					c++
				}
			}
			counts[t] = c
		}(t)
	}
	wg.Wait()
	var total int64
	for _, c := range counts {
		total += c
	}
	return []int64{total}
}

func Emit(res any, sink func(int64)) { sink(res.([]int64)[0]) }
