package main

import (
	"fmt"
	"os"
	"strconv"
)

func main() {
	n, _ := strconv.Atoi(os.Args[1])
	s := make([]bool, n+1)
	for i := 2; i <= n; i++ {
		s[i] = true
	}
	for p := 2; p*p <= n; p++ {
		if s[p] {
			for m := p * p; m <= n; m += p {
				s[m] = false
			}
		}
	}
	count, last := 0, 0
	var sum int64
	for i := 2; i <= n; i++ {
		if s[i] {
			count++
			last = i
			sum += int64(i)
		}
	}
	fmt.Printf("count=%d\nlast=%d\nsum=%d\n", count, last, sum)
}
