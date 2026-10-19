setup <- function(args) NULL
decode <- function(data) readBin(data, "integer", n = length(data) %/% 4L, size = 4L, endian = "little")
solve <- function(a) sort(a)   # radix sort for integer vectors
emit <- function(a) as.numeric(a)
