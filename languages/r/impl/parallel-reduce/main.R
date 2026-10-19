# the parallel package forks one process per worker (mclapply)
library(parallel)
n_arg <- 2000000
workers_arg <- 4L
setup <- function(args) if (length(args) > 1L) { n_arg <<- as.numeric(args[1L]); workers_arg <<- as.integer(args[2L]) }
decode <- function(data) NULL

# integer arithmetic: the numbers stay below 2^31, and integer %% is much cheaper than the double one
is_prime <- function(n) {
  if (n < 2L) return(FALSE)
  if (n < 4L) return(TRUE)
  if (n %% 2L == 0L) return(FALSE)
  d <- 3L
  while (d * d <= n) {
    if (n %% d == 0L) return(FALSE)
    d <- d + 2L
  }
  TRUE
}

solve <- function(inst) {
  n <- n_arg
  workers <- workers_arg
  parts <- mclapply(0:(workers - 1L), function(t) {
    count <- 0L
    for (i in seq.int(as.integer(t), as.integer(n) - 1L, by = as.integer(workers))) if (is_prime(i)) count <- count + 1L
    count
  }, mc.cores = workers)
  sum(unlist(parts))
}
emit <- function(r) as.numeric(r)
