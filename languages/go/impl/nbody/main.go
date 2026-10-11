// N-body simulation, after the Computer Language Benchmarks Game.
package main

import (
	"fmt"
	"math"
	"os"
	"strconv"
)

const (
	solarMass = 4 * math.Pi * math.Pi
	daysPerYr = 365.24
)

type Body struct {
	x, y, z, vx, vy, vz, mass float64
}

func newSystem() []Body {
	return []Body{
		{0, 0, 0, 0, 0, 0, solarMass},
		{
			4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
			1.66007664274403694e-03 * daysPerYr, 7.69901118419740425e-03 * daysPerYr, -6.90460016972063023e-05 * daysPerYr,
			9.54791938424326609e-04 * solarMass,
		},
		{
			8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
			-2.76742510726862411e-03 * daysPerYr, 4.99852801234917238e-03 * daysPerYr, 2.30417297573763929e-05 * daysPerYr,
			2.85885980666130812e-04 * solarMass,
		},
		{
			1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
			2.96460137564761618e-03 * daysPerYr, 2.37847173959480950e-03 * daysPerYr, -2.96589568540237556e-05 * daysPerYr,
			4.36624404335156298e-05 * solarMass,
		},
		{
			1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
			2.68067772490389322e-03 * daysPerYr, 1.62824170038242295e-03 * daysPerYr, -9.51592254519715870e-05 * daysPerYr,
			5.15138902046611451e-05 * solarMass,
		},
	}
}

func offsetMomentum(bodies []Body) {
	var px, py, pz float64
	for _, b := range bodies {
		px += b.vx * b.mass
		py += b.vy * b.mass
		pz += b.vz * b.mass
	}
	bodies[0].vx = -px / solarMass
	bodies[0].vy = -py / solarMass
	bodies[0].vz = -pz / solarMass
}

func energy(bodies []Body) float64 {
	var e float64
	for i := range bodies {
		b := &bodies[i]
		e += 0.5 * b.mass * (b.vx*b.vx + b.vy*b.vy + b.vz*b.vz)
		for j := i + 1; j < len(bodies); j++ {
			b2 := &bodies[j]
			dx := b.x - b2.x
			dy := b.y - b2.y
			dz := b.z - b2.z
			e -= (b.mass * b2.mass) / math.Sqrt(dx*dx+dy*dy+dz*dz)
		}
	}
	return e
}

func advance(bodies []Body, dt float64) {
	for i := range bodies {
		b := &bodies[i]
		for j := i + 1; j < len(bodies); j++ {
			b2 := &bodies[j]
			dx := b.x - b2.x
			dy := b.y - b2.y
			dz := b.z - b2.z
			d2 := dx*dx + dy*dy + dz*dz
			mag := dt / (d2 * math.Sqrt(d2))
			b.vx -= dx * b2.mass * mag
			b.vy -= dy * b2.mass * mag
			b.vz -= dz * b2.mass * mag
			b2.vx += dx * b.mass * mag
			b2.vy += dy * b.mass * mag
			b2.vz += dz * b.mass * mag
		}
	}
	for i := range bodies {
		b := &bodies[i]
		b.x += dt * b.vx
		b.y += dt * b.vy
		b.z += dt * b.vz
	}
}

func main() {
	n, _ := strconv.Atoi(os.Args[1])
	bodies := newSystem()
	offsetMomentum(bodies)
	fmt.Printf("%.9f\n", energy(bodies))
	for i := 0; i < n; i++ {
		advance(bodies, 0.01)
	}
	fmt.Printf("%.9f\n", energy(bodies))
}
