package main

import (
	"fmt"
	"os"
	"strconv"
	"sync"
)

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

func main() {
	n, _ := strconv.Atoi(os.Args[1])
	workers, _ := strconv.Atoi(os.Args[2])

	counts := make([]int, workers)
	var wg sync.WaitGroup
	for t := 0; t < workers; t++ {
		wg.Add(1)
		go func(t int) {
			defer wg.Done()
			c := 0
			for i := t; i < n; i += workers {
				if isPrime(i) {
					c++
				}
			}
			counts[t] = c
		}(t)
	}
	wg.Wait()

	total := 0
	for _, c := range counts {
		total += c
	}
	fmt.Printf("primes=%d\n", total)
}
