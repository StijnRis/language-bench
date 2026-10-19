package main

import (
	"bufio"
	"os"
	"strconv"
	"strings"
)

func Setup(args []string) {}

func Decode(data []byte) any { return string(data) } // path of the file

func Solve(inst any) any {
	f, err := os.Open(inst.(string))
	if err != nil {
		panic(err)
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 1<<16), 1<<20)
	freq := map[string]int64{}
	var lines, total int64
	for sc.Scan() {
		line := sc.Text()
		c1 := strings.IndexByte(line, ',')
		c2 := c1 + 1 + strings.IndexByte(line[c1+1:], ',')
		v, _ := strconv.ParseInt(line[c2+1:], 10, 64)
		total += v
		freq[line[c1+1:c2]]++
		lines++
	}
	top, topCount := "", int64(-1)
	for w, c := range freq {
		if c > topCount || (c == topCount && w < top) {
			top, topCount = w, c
		}
	}
	out := []int64{lines, total, int64(len(freq)), topCount, int64(len(top))}
	for i := 0; i < len(top); i++ {
		out = append(out, int64(top[i]))
	}
	return out
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int64) {
		sink(v)
	}
}
