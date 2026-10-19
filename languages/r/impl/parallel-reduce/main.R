# the parallel package forks one process per worker (mclapply)
library(parallel)

is_prime <- function(n) {
  if (n < 2) return(FALSE)
  if (n < 4) return(TRUE)
  if (n %% 2 == 0) return(FALSE)
  d <- 3
  while (d * d <= n) {
    if (n %% d == 0) return(FALSE)
    d <- d + 2
  }
  TRUE
}

args <- commandArgs(trailingOnly = TRUE)
n <- as.numeric(args[1])
workers <- as.integer(args[2])
parts <- mclapply(0:(workers - 1L), function(t) {
  count <- 0L
  for (i in seq(t, n - 1, by = workers)) if (is_prime(i)) count <- count + 1L
  count
}, mc.cores = workers)
cat(sprintf("primes=%d\n", sum(unlist(parts))))
