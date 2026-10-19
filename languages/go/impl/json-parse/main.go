package main

import "encoding/json"

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

func Setup(args []string) {}

func Decode(data []byte) any { return data }

func Solve(inst any) any {
	objects, trues, nulls, strLen, intSum = 0, 0, 0, 0, 0
	var doc any
	if err := json.Unmarshal(inst.([]byte), &doc); err != nil {
		panic(err)
	}
	walk(doc)
	return []int64{objects, int64(intSum), strLen, trues, nulls}
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int64) {
		sink(v)
	}
}
