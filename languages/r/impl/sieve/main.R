n <- as.integer(commandArgs(trailingOnly = TRUE)[1])
prime <- rep(TRUE, n)   # prime[i] is the flag of the number i
prime[1L] <- FALSE
p <- 2L
while (p * p <= n) {
  # vector assignment over the multiples is R's fast path for a sieve
  if (prime[p]) prime[seq.int(p * p, n, by = p)] <- FALSE
  p <- p + 1L
}
primes <- which(prime)
cat(sprintf("count=%d\nlast=%d\nsum=%.0f\n", length(primes), primes[length(primes)], sum(as.numeric(primes))))
