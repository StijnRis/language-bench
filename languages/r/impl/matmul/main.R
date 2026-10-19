# %*% calls the BLAS linked into R (the reference BLAS in the Docker image): R's idiomatic fast path
setup <- function(args) NULL
decode <- function(data) {
  n <- readBin(data[1:4], "integer", size = 4L, endian = "little")
  v <- readBin(data[-(1:4)], "double", n = 2L * n * n, size = 8L, endian = "little")
  list(matrix(v[seq_len(n * n)], n, n, byrow = TRUE), matrix(v[n * n + seq_len(n * n)], n, n, byrow = TRUE))
}
solve <- function(inst) inst[[1L]] %*% inst[[2L]]
emit <- function(c) floor(as.numeric(t(c)) + 0.5)
