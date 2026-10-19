n <- as.integer(commandArgs(trailingOnly = TRUE)[1])
x <- 1
a <- numeric(n)
for (i in seq_len(n)) {
  x <- (x * 48271) %% 2147483647
  a[i] <- x
}

a <- sort(a)

checksum <- sum(((seq_len(n) - 1) * a) %% 1000000007) %% 1000000007
cat(sprintf("first=%.0f\nlast=%.0f\nmedian=%.0f\nchecksum=%.0f\n", a[1L], a[n], a[n %/% 2L + 1L], checksum))
