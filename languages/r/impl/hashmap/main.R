# match() and unique() are R's built-in hash tables: the counts live in a vector indexed by the position of the key
setup <- function(args) NULL
decode <- function(data) {
  a <- readBin(data, "integer", n = length(data) %/% 4L, size = 4L, endian = "little")
  n <- length(a) %/% 2L
  list(a[seq_len(n)], a[n + seq_len(n)])
}
solve <- function(inst) {
  keys <- inst[[1L]]
  lookups <- inst[[2L]]
  u <- unique(keys)
  counts <- tabulate(match(keys, u), nbins = length(u))
  checksum <- sum(as.numeric(u) * counts)
  found <- counts[match(lookups, u)]
  c(length(u), checksum, sum(as.numeric(found), na.rm = TRUE))
}
emit <- function(r) r
