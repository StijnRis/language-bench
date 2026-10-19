package main

import (
	"strings"
	"unicode/utf8"
)

func Setup(args []string) {}

func Decode(data []byte) any { return string(data) }

func Solve(inst any) any {
	text := inst.(string)
	replaced := strings.ReplaceAll(text, " ", "_")
	var checksum int64
	for i := 0; i < len(replaced); i++ {
		checksum += int64(replaced[i])
	}
	return []int64{int64(len(text)), int64(utf8.RuneCountInString(text)), int64(strings.Count(text, " ") + 1), int64(strings.Count(text, "er")), checksum}
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int64) {
		sink(v)
	}
}
