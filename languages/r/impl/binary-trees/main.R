# Binary trees, after the Computer Language Benchmarks Game.
depth_arg <- 14L
setup <- function(args) if (length(args)) depth_arg <<- as.integer(args[1L])
decode <- function(data) NULL

make_tree <- function(d) {
  if (d == 0L) return(list(NULL, NULL))
  d <- d - 1L
  list(make_tree(d), make_tree(d))
}
check_tree <- function(node) {
  if (is.null(node[[1L]])) return(1)
  1 + check_tree(node[[1L]]) + check_tree(node[[2L]])
}

solve <- function(inst) {
  min_depth <- 4L
  max_depth <- max(min_depth + 2L, depth_arg)
  out <- check_tree(make_tree(max_depth + 1L))
  long_lived <- make_tree(max_depth)
  for (depth in seq(min_depth, max_depth, by = 2L)) {
    iterations <- bitwShiftL(1L, max_depth - depth + min_depth)
    total <- 0
    for (i in seq_len(iterations)) total <- total + check_tree(make_tree(depth))
    out <- c(out, iterations, total)
  }
  c(out, check_tree(long_lived))
}
emit <- function(r) as.numeric(r)
