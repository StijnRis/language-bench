// language-bench harness for Go: see harness/CONTRACT.md. Built together with problem.go (the problem's main.go),
// which provides Setup, Decode, Solve and Emit; instance and result are opaque `any` values.
package main

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
	"unsafe"
)

type timespec struct{ sec, nsec int64 }

func now(clk uintptr) int64 {
	var ts timespec
	syscall.Syscall(syscall.SYS_CLOCK_GETTIME, clk, uintptr(unsafe.Pointer(&ts)), 0)
	return ts.sec*1000000000 + ts.nsec
}

const (
	clockRealtime  = 0
	clockMonotonic = 1
)

func num(k string, d float64) float64 {
	if v := os.Getenv(k); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return d
}

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func fail(msg string) {
	fmt.Fprintln(os.Stderr, "harness: "+msg)
	os.Exit(1)
}

type row struct{ t0, t1, h1, h2 int64 }

func main() {
	input := env("LB_INPUT", "none")
	budget := num("LB_BUDGET_SECONDS", 10) * 1e9
	minIters := int(num("LB_MIN_ITERS", 3))
	maxIters := int(num("LB_MAX_ITERS", 0))
	start := int64(num("LB_START", 0))
	gen := env("LB_GEN", "/usr/local/bin/lbgen")
	file := env("LB_FILE", "/dev/shm/lb-input")
	problem := env("LB_PROBLEM", "")
	fileReady := os.Getenv("LB_FILE_READY") != ""

	Setup(os.Args[1:])
	in := bufio.NewReaderSize(os.Stdin, 1<<16)
	var buf []byte
	var rows []row
	kernel := 0.0
	mono0, wall0 := now(clockMonotonic), now(clockRealtime)
	reason := "budget"

	for {
		switch input {
		case "stream":
			var hdr [8]byte
			if _, err := io.ReadFull(in, hdr[:]); err != nil {
				fail("input ended early")
			}
			n := int(binary.LittleEndian.Uint64(hdr[:]))
			if cap(buf) < n {
				buf = make([]byte, n)
			}
			buf = buf[:n]
			if _, err := io.ReadFull(in, buf); err != nil {
				fail("input ended early")
			}
		case "file":
			if !fileReady {
				if err := exec.Command(gen, "file", problem, strconv.FormatInt(start+int64(len(rows)), 10), file).Run(); err != nil {
					fail("generator failed: " + err.Error())
				}
			}
			buf = []byte(file)
		default:
			buf = buf[:0]
		}
		inst := Decode(buf)
		t0 := now(clockMonotonic)
		res := Solve(inst)
		t1 := now(clockMonotonic)
		var a, b, n int64 = 17, 19, 0
		mix := func(w int64) {
			m1 := ((w % 2147483647) + 2147483647) % 2147483647
			m2 := ((w % 2147483629) + 2147483629) % 2147483629
			a = (a*1000003 + m1) % 2147483647
			b = (b*999983 + m2) % 2147483629
		}
		Emit(res, func(w int64) { mix(w); n++ })
		mix(n)
		if input == "file" && !fileReady {
			os.Remove(file)
		}
		rows = append(rows, row{t0, t1, a, b})
		kernel += float64(t1 - t0)
		if maxIters > 0 && len(rows) >= maxIters {
			reason = "iters"
			break
		}
		if kernel >= budget && len(rows) >= minIters {
			break
		}
	}

	var sb strings.Builder
	fmt.Fprintf(&sb, "LB 1 clock=CLOCK_MONOTONIC\nSTART mono=%d wall=%d\n", mono0, wall0)
	for i, r := range rows {
		fmt.Fprintf(&sb, "ITER %d t0=%d t1=%d check=%d:%d\n", i+1, r.t0, r.t1, r.h1, r.h2)
	}
	fmt.Fprintf(&sb, "DONE iters=%d kernel_ns=%d reason=%s\n", len(rows), int64(kernel), reason)
	os.Stdout.WriteString(sb.String())
}
