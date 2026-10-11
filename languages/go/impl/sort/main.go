package main

import (
	"fmt"
	"os"
	"slices"
	"strconv"
)

func main() {
	n, _ := strconv.Atoi(os.Args[1])
	var x int64 = 1
	a := make([]int32, n)
	for i := range a {
		x = x * 48271 % 2147483647
		a[i] = int32(x)
	}

	slices.Sort(a)

	var checksum int64
	for i, v := range a {
		checksum = (checksum + int64(i)*int64(v)) % 1000000007
	}

	fmt.Printf("first=%d\n", a[0])
	fmt.Printf("last=%d\n", a[n-1])
	fmt.Printf("median=%d\n", a[n/2])
	fmt.Printf("checksum=%d\n", checksum)
}
