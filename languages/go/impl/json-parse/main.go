package main

import (
	"encoding/json"
	"fmt"
	"os"
)

var objects, trues, nulls, strLen int64
var intSum float64

func walk(v any) {
	switch t := v.(type) {
	case nil:
		nulls++
	case bool:
		if t {
			trues++
		}
	case float64:
		intSum += t
	case string:
		strLen += int64(len(t))
	case []any:
		for _, x := range t {
			walk(x)
		}
	case map[string]any:
		objects++
		for _, x := range t {
			walk(x)
		}
	}
}

func main() {
	data, err := os.ReadFile(os.Args[1])
	if err != nil {
		panic(err)
	}
	var doc any
	if err := json.Unmarshal(data, &doc); err != nil {
		panic(err)
	}
	walk(doc)
	fmt.Printf("objects=%d\n", objects)
	fmt.Printf("int_sum=%d\n", int64(intSum))
	fmt.Printf("string_length=%d\n", strLen)
	fmt.Printf("true=%d\n", trues)
	fmt.Printf("null=%d\n", nulls)
}
