n_arg <- 9L
setup <- function(args) if (length(args)) n_arg <<- as.integer(args[1L])
decode <- function(data) NULL
solve <- function(inst) {
  n <- n_arg
  perm1 <- 0:(n - 1L)
  count <- integer(n)
  maxflips <- 0L
  permcount <- 0L
  checksum <- 0L
  r <- n
  repeat {
    while (r != 1L) {
      count[r] <- r
      r <- r - 1L
    }
    perm <- perm1
    flips <- 0L
    k <- perm[1L]
    while (k != 0L) {
      perm[1:(k + 1L)] <- perm[(k + 1L):1L]
      flips <- flips + 1L
      k <- perm[1L]
    }
    if (flips > maxflips) maxflips <- flips
    checksum <- checksum + (if (permcount %% 2L == 0L) flips else -flips)
    repeat {
      if (r == n) return(c(checksum, maxflips))
      p0 <- perm1[1L]
      perm1[1:r] <- perm1[2:(r + 1L)]
      perm1[r + 1L] <- p0
      count[r + 1L] <- count[r + 1L] - 1L
      if (count[r + 1L] > 0L) break
      r <- r + 1L
    }
    permcount <- permcount + 1L
  }
}
emit <- function(r) as.numeric(r)
solve <- compiler::cmpfun(solve)   # a function called once would otherwise run in the AST interpreter
