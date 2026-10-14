package main

import (
	"fmt"
	"os"
	"strconv"
)

func main() {
	n, _ := strconv.Atoi(os.Args[1])
	a := make([]float64, n*n)
	b := make([]float64, n*n)
	c := make([]float64, n*n)
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			a[i*n+j] = float64((i*31+j*17)%10 + 1)
			b[i*n+j] = float64((i*13+j*7)%10 - 4)
		}
	}

	for i := 0; i < n; i++ {
		for k := 0; k < n; k++ {
			aik := a[i*n+k]
			brow := b[k*n : (k+1)*n]
			crow := c[i*n : (i+1)*n]
			for j := range crow {
				// explicit conversion forbids fused multiply-add, like in the other languages
				crow[j] += float64(aik * brow[j])
			}
		}
	}

	var trace, sum float64
	for i := 0; i < n; i++ {
		trace += c[i*n+i]
	}
	for _, v := range c {
		sum += v
	}
	fmt.Printf("trace=%d\n", int64(trace))
	fmt.Printf("sum=%d\n", int64(sum))
	fmt.Printf("c00=%d\n", int64(c[0]))
	fmt.Printf("clast=%d\n", int64(c[n*n-1]))
}
