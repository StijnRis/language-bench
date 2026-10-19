n <- as.integer(commandArgs(trailingOnly = TRUE)[1])
perm1 <- 0:(n - 1L)
count <- integer(n)
maxflips <- 0L
permcount <- 0L
checksum <- 0L
r <- n
repeat {
  while (r != 1L) {
    count[r] <- r
    r <- r - 1L
  }
  perm <- perm1
  flips <- 0L
  k <- perm[1L]
  while (k != 0L) {
    perm[1:(k + 1L)] <- perm[(k + 1L):1L]
    flips <- flips + 1L
    k <- perm[1L]
  }
  if (flips > maxflips) maxflips <- flips
  checksum <- checksum + (if (permcount %% 2L == 0L) flips else -flips)
  repeat {
    if (r == n) {
      cat(sprintf("checksum=%d\nmaxflips=%d\n", checksum, maxflips))
      quit(save = "no", status = 0)
    }
    p0 <- perm1[1L]
    perm1[1:r] <- perm1[2:(r + 1L)]
    perm1[r + 1L] <- p0
    count[r + 1L] <- count[r + 1L] - 1L
    if (count[r + 1L] > 0L) break
    r <- r + 1L
  }
  permcount <- permcount + 1L
}
