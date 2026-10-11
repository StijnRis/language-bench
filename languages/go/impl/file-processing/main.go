package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func main() {
	f, err := os.Open(os.Args[1])
	if err != nil {
		panic(err)
	}
	defer f.Close()

	freq := make(map[string]int)
	lines := 0
	var total int64

	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	for sc.Scan() {
		line := sc.Text()
		_, rest, _ := strings.Cut(line, ",")
		word, value, _ := strings.Cut(rest, ",")
		v, _ := strconv.ParseInt(value, 10, 64)
		total += v
		freq[word]++
		lines++
	}

	top, topCount := "", -1
	for w, c := range freq {
		if c > topCount || (c == topCount && w < top) {
			top, topCount = w, c
		}
	}

	fmt.Printf("lines=%d\n", lines)
	fmt.Printf("sum=%d\n", total)
	fmt.Printf("distinct=%d\n", len(freq))
	fmt.Printf("top=%s %d\n", top, topCount)
}
