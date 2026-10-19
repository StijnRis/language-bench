// N-body simulation, after the Computer Language Benchmarks Game.
package main

import (
	"encoding/binary"
	"math"
	"strconv"
)

const solarMass = 4 * math.Pi * math.Pi

type Body struct{ x, y, z, vx, vy, vz, mass float64 }

var steps = 1000000

func energy(b *[5]Body) float64 {
	e := 0.0
	for i := 0; i < 5; i++ {
		e += 0.5 * b[i].mass * (b[i].vx*b[i].vx + b[i].vy*b[i].vy + b[i].vz*b[i].vz)
		for j := i + 1; j < 5; j++ {
			dx, dy, dz := b[i].x-b[j].x, b[i].y-b[j].y, b[i].z-b[j].z
			e -= b[i].mass * b[j].mass / math.Sqrt(dx*dx+dy*dy+dz*dz)
		}
	}
	return e
}

func Setup(args []string) {
	if len(args) > 0 {
		steps, _ = strconv.Atoi(args[0])
	}
}

func Decode(data []byte) any {
	f := func(i int) float64 { return math.Float64frombits(binary.LittleEndian.Uint64(data[8*i:])) }
	var b [5]Body
	for i := range b {
		b[i] = Body{f(i * 7), f(i*7 + 1), f(i*7 + 2), f(i*7 + 3), f(i*7 + 4), f(i*7 + 5), f(i*7 + 6)}
	}
	return &b
}

func Solve(inst any) any {
	b := inst.(*[5]Body)
	var px, py, pz float64
	for i := range b {
		px += b[i].vx * b[i].mass
		py += b[i].vy * b[i].mass
		pz += b[i].vz * b[i].mass
	}
	b[0].vx, b[0].vy, b[0].vz = -px/solarMass, -py/solarMass, -pz/solarMass
	e0 := energy(b)
	const dt = 0.01
	for s := 0; s < steps; s++ {
		for i := 0; i < 5; i++ {
			for j := i + 1; j < 5; j++ {
				dx, dy, dz := b[i].x-b[j].x, b[i].y-b[j].y, b[i].z-b[j].z
				d2 := dx*dx + dy*dy + dz*dz
				mag := dt / (d2 * math.Sqrt(d2))
				bm, cm := b[i].mass*mag, b[j].mass*mag
				b[i].vx -= dx * cm
				b[i].vy -= dy * cm
				b[i].vz -= dz * cm
				b[j].vx += dx * bm
				b[j].vy += dy * bm
				b[j].vz += dz * bm
			}
		}
		for i := range b {
			b[i].x += dt * b[i].vx
			b[i].y += dt * b[i].vy
			b[i].z += dt * b[i].vz
		}
	}
	return [2]float64{e0, energy(b)}
}

func Emit(res any, sink func(int64)) {
	e := res.([2]float64)
	for _, v := range e {
		sink(int64(math.Floor(v*1e9 + 0.5)))
	}
}
