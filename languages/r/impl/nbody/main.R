# N-body simulation, after the Computer Language Benchmarks Game.
PI <- 3.141592653589793
SOLAR_MASS <- 4 * PI * PI
DAYS <- 365.24

x <- c(0, 4.84143144246472090e+00, 8.34336671824457987e+00, 1.28943695621391310e+01, 1.53796971148509165e+01)
y <- c(0, -1.16032004402742839e+00, 4.12479856412430479e+00, -1.51111514016986312e+01, -2.59193146099879641e+01)
z <- c(0, -1.03622044471123109e-01, -4.03523417114321381e-01, -2.23307578892655734e-01, 1.79258772950371181e-01)
vx <- c(0, 1.66007664274403694e-03, -2.76742510726862411e-03, 2.96460137564761618e-03, 2.68067772490389322e-03) * DAYS
vy <- c(0, 7.69901118419740425e-03, 4.99852801234917238e-03, 2.37847173959480950e-03, 1.62824170038242295e-03) * DAYS
vz <- c(0, -6.90460016972063023e-05, 2.30417297573763929e-05, -2.96589568540237556e-05, -9.51592254519715870e-05) * DAYS
m <- c(1, 9.54791938424326609e-04, 2.85885980666130812e-04, 4.36624404335156298e-05, 5.15138902046611451e-05) * SOLAR_MASS
nb <- 5L

energy <- function() {
  e <- 0
  for (i in 1:nb) {
    e <- e + 0.5 * m[i] * (vx[i]^2 + vy[i]^2 + vz[i]^2)
    if (i < nb) for (j in (i + 1L):nb) {
      dx <- x[i] - x[j]; dy <- y[i] - y[j]; dz <- z[i] - z[j]
      e <- e - m[i] * m[j] / sqrt(dx * dx + dy * dy + dz * dz)
    }
  }
  e
}

advance <- function(dt) {
  for (i in 1:(nb - 1L)) {
    for (j in (i + 1L):nb) {
      dx <- x[i] - x[j]; dy <- y[i] - y[j]; dz <- z[i] - z[j]
      d2 <- dx * dx + dy * dy + dz * dz
      mag <- dt / (d2 * sqrt(d2))
      bm <- m[i] * mag
      cm <- m[j] * mag
      vx[i] <<- vx[i] - dx * cm; vy[i] <<- vy[i] - dy * cm; vz[i] <<- vz[i] - dz * cm
      vx[j] <<- vx[j] + dx * bm; vy[j] <<- vy[j] + dy * bm; vz[j] <<- vz[j] + dz * bm
    }
  }
  x <<- x + dt * vx
  y <<- y + dt * vy
  z <<- z + dt * vz
}

vx[1L] <- -sum(vx * m) / SOLAR_MASS
vy[1L] <- -sum(vy * m) / SOLAR_MASS
vz[1L] <- -sum(vz * m) / SOLAR_MASS

steps <- as.integer(commandArgs(trailingOnly = TRUE)[1])
cat(sprintf("%.9f\n", energy()))
for (s in seq_len(steps)) advance(0.01)
cat(sprintf("%.9f\n", energy()))
