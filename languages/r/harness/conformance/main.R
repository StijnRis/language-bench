# conformance problem: sum, maximum and a checksum of 4096 int32 values
setup <- function(args) NULL
decode <- function(data) readBin(data, "integer", n = length(data) %/% 4L, size = 4L, endian = "little")
solve <- function(a) {
  sq <- 0
  for (v in a) sq <- (sq + as.numeric(v) * v) %% 1000003
  c(sum(as.numeric(a)), max(a), sq, length(a))
}
emit <- function(r) r
