n_arg <- 10000000L
setup <- function(args) if (length(args)) n_arg <<- as.integer(args[1L])
decode <- function(data) NULL
solve <- function(inst) {
  n <- n_arg
  prime <- rep(TRUE, n)   # prime[i] is the flag of the number i
  prime[1L] <- FALSE
  p <- 2L
  while (p * p <= n) {
    # vector assignment over the multiples is R's fast path for a sieve
    if (prime[p]) prime[seq.int(p * p, n, by = p)] <- FALSE
    p <- p + 1L
  }
  primes <- which(prime)
  c(length(primes), primes[length(primes)], sum(as.numeric(primes)))
}
emit <- function(r) as.numeric(r)
