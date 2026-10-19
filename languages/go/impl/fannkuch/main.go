package main

import "strconv"

var nArg = 9

func Setup(args []string) {
	if len(args) > 0 {
		nArg, _ = strconv.Atoi(args[0])
	}
}

func Decode(data []byte) any { return nil }

func Solve(inst any) any {
	n := nArg
	perm1 := make([]int, n)
	perm := make([]int, n)
	count := make([]int, n)
	for i := range perm1 {
		perm1[i] = i
	}
	maxflips, permcount := 0, 0
	var checksum int64
	r := n
	for {
		for r != 1 {
			count[r-1] = r
			r--
		}
		copy(perm, perm1)
		flips := 0
		for k := perm[0]; k != 0; k = perm[0] {
			for i, j := 0, k; i < j; i, j = i+1, j-1 {
				perm[i], perm[j] = perm[j], perm[i]
			}
			flips++
		}
		if flips > maxflips {
			maxflips = flips
		}
		if permcount%2 == 0 {
			checksum += int64(flips)
		} else {
			checksum -= int64(flips)
		}
		for {
			if r == n {
				return []int64{checksum, int64(maxflips)}
			}
			p0 := perm1[0]
			copy(perm1[:r], perm1[1:r+1])
			perm1[r] = p0
			count[r]--
			if count[r] > 0 {
				break
			}
			r++
		}
		permcount++
	}
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int64) {
		sink(v)
	}
}
