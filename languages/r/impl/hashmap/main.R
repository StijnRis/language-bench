# an environment is R's hash map; keys must be strings
n <- as.numeric(commandArgs(trailingOnly = TRUE)[1])
x <- 1
m <- new.env(hash = TRUE, size = 1048576L)
half <- n %/% 2
for (i in seq_len(n)) {
  x <- (x * 48271) %% 2147483647
  key <- as.character(x %% half)
  m[[key]] <- (if (is.null(c <- m[[key]])) 0L else c) + 1L
}

keys <- ls(m, sorted = FALSE)
counts <- unlist(mget(keys, envir = m), use.names = FALSE)
checksum <- sum(as.numeric(keys) * counts)

hits <- 0
for (i in seq_len(n)) {
  x <- (x * 48271) %% 2147483647
  c <- m[[as.character(x %% n)]]
  if (!is.null(c)) hits <- hits + c
}

cat(sprintf("distinct=%d\nchecksum=%.0f\nhits=%.0f\n", length(keys), checksum, hits))
