package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"unicode/utf8"
)

var vocab = []string{
	"the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
	"über", "résumé", "привет", "мир",
	"код", "日本語", "世界", "速度", "hello", "world",
}

func main() {
	n, _ := strconv.Atoi(os.Args[1])
	var x int64 = 1
	words := make([]string, n)
	for i := range words {
		x = x * 48271 % 2147483647
		words[i] = vocab[x%int64(len(vocab))]
	}
	text := strings.Join(words, " ")

	replaced := strings.ReplaceAll(text, " ", "_")
	var checksum int64
	for i := 0; i < len(replaced); i++ {
		checksum += int64(replaced[i])
	}

	fmt.Printf("bytes=%d\n", len(text))
	fmt.Printf("codepoints=%d\n", utf8.RuneCountInString(text))
	fmt.Printf("words=%d\n", len(strings.Split(text, " ")))
	fmt.Printf("needle=%d\n", strings.Count(text, "er"))
	fmt.Printf("checksum=%d\n", checksum)
}
