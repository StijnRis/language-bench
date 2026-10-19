# N-body simulation, after the Computer Language Benchmarks Game.
steps <- 1000000
setup <- function(args) if (length(args)) steps <<- as.integer(args[1L])
decode <- function(data) matrix(readBin(data, "double", n = 35L, size = 8L, endian = "little"), 5L, 7L, byrow = TRUE)

energy <- function(x, y, z, vx, vy, vz, m) {
  e <- 0
  for (i in 1:5) {
    e <- e + 0.5 * m[i] * (vx[i]^2 + vy[i]^2 + vz[i]^2)
    if (i < 5L) for (j in (i + 1L):5L) {
      dx <- x[i] - x[j]; dy <- y[i] - y[j]; dz <- z[i] - z[j]
      e <- e - m[i] * m[j] / sqrt(dx * dx + dy * dy + dz * dz)
    }
  }
  e
}

solve <- function(b) {
  x <- b[, 1L]; y <- b[, 2L]; z <- b[, 3L]; vx <- b[, 4L]; vy <- b[, 5L]; vz <- b[, 6L]; m <- b[, 7L]
  solar <- 4 * pi * pi
  vx[1L] <- -sum(vx * m) / solar
  vy[1L] <- -sum(vy * m) / solar
  vz[1L] <- -sum(vz * m) / solar
  e0 <- energy(x, y, z, vx, vy, vz, m)
  dt <- 0.01
  for (s in seq_len(steps)) {
    for (i in 1:4) {
      for (j in (i + 1L):5L) {
        dx <- x[i] - x[j]; dy <- y[i] - y[j]; dz <- z[i] - z[j]
        d2 <- dx * dx + dy * dy + dz * dz
        mag <- dt / (d2 * sqrt(d2))
        bm <- m[i] * mag
        cm <- m[j] * mag
        vx[i] <- vx[i] - dx * cm; vy[i] <- vy[i] - dy * cm; vz[i] <- vz[i] - dz * cm
        vx[j] <- vx[j] + dx * bm; vy[j] <- vy[j] + dy * bm; vz[j] <- vz[j] + dz * bm
      }
    }
    x <- x + dt * vx
    y <- y + dt * vy
    z <- z + dt * vz
  }
  c(e0, energy(x, y, z, vx, vy, vz, m))
}
emit <- function(r) floor(r * 1e9 + 0.5)
solve <- compiler::cmpfun(solve)   # a function called once would otherwise run in the AST interpreter
