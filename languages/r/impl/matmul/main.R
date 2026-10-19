# %*% calls the BLAS linked into R (the reference BLAS in the Docker image): R's idiomatic fast path
n <- as.integer(commandArgs(trailingOnly = TRUE)[1])
idx <- 0:(n - 1L)
a <- outer(idx, idx, function(i, j) (i * 31 + j * 17) %% 10 + 1)
b <- outer(idx, idx, function(i, j) (i * 13 + j * 7) %% 10 - 4)
c <- a %*% b
cat(sprintf("trace=%.0f\nsum=%.0f\nc00=%.0f\nclast=%.0f\n", sum(diag(c)), sum(c), c[1L, 1L], c[n, n]))
