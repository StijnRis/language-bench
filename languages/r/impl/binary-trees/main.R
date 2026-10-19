# Binary trees, after the Computer Language Benchmarks Game.
make_tree <- function(d) {
  if (d == 0L) return(list(NULL, NULL))
  d <- d - 1L
  list(make_tree(d), make_tree(d))
}

check_tree <- function(node) {
  if (is.null(node[[1L]])) return(1)
  1 + check_tree(node[[1L]]) + check_tree(node[[2L]])
}

n <- as.integer(commandArgs(trailingOnly = TRUE)[1])
min_depth <- 4L
max_depth <- max(min_depth + 2L, n)
stretch <- max_depth + 1L

cat(sprintf("stretch tree of depth %d\t check: %.0f\n", stretch, check_tree(make_tree(stretch))))
long_lived <- make_tree(max_depth)

for (depth in seq(min_depth, max_depth, by = 2L)) {
  iterations <- bitwShiftL(1L, max_depth - depth + min_depth)
  total <- 0
  for (i in seq_len(iterations)) total <- total + check_tree(make_tree(depth))
  cat(sprintf("%d\t trees of depth %d\t check: %.0f\n", iterations, depth, total))
}

cat(sprintf("long lived tree of depth %d\t check: %.0f\n", max_depth, check_tree(long_lived)))
