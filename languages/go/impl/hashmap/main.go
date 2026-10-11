package main

import (
	"fmt"
	"os"
	"strconv"
)

func main() {
	n, _ := strconv.Atoi(os.Args[1])
	var x int64 = 1
	next := func() int64 {
		x = x * 48271 % 2147483647
		return x
	}

	m := make(map[int64]int64)
	half := int64(n / 2)
	for i := 0; i < n; i++ {
		m[next()%half]++
	}

	var checksum int64
	for k, c := range m {
		checksum += k * c
	}

	var hits int64
	for i := 0; i < n; i++ {
		hits += m[next()%int64(n)]
	}

	fmt.Printf("distinct=%d\n", len(m))
	fmt.Printf("checksum=%d\n", checksum)
	fmt.Printf("hits=%d\n", hits)
}
