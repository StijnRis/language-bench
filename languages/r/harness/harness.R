# language-bench harness for R: see harness/CONTRACT.md.
# usage: Rscript harness.R <problem.R> [problem arguments]
# The problem file defines setup(args), decode(raw), solve(instance), emit(result) -> numeric vector of whole
# numbers (the canonical result words) and optionally release(instance, result); it is evaluated in its own
# environment.
cmd <- commandArgs(trailingOnly = TRUE)
P <- new.env()
sys.source(cmd[1L], envir = P)

num <- function(k, d) {
  v <- Sys.getenv(k, "")
  if (nzchar(v)) as.numeric(v) else d
}
env <- function(k, d) {
  v <- Sys.getenv(k, "")
  if (nzchar(v)) v else d
}
# R's only clock with sub-millisecond resolution: elapsed seconds since the process started
mono <- function() round(proc.time()[["elapsed"]] * 1e9)

input <- env("LB_INPUT", "none")
budget <- num("LB_BUDGET_SECONDS", 10) * 1e9
min_iters <- num("LB_MIN_ITERS", 3)
max_iters <- num("LB_MAX_ITERS", 0)
start <- num("LB_START", 0)
gen <- env("LB_GEN", "/usr/local/bin/lbgen")
file <- env("LB_FILE", "/dev/shm/lb-input")
pname <- env("LB_PROBLEM", "")
file_ready <- nzchar(Sys.getenv("LB_FILE_READY", ""))
P1 <- 2147483647
P2 <- 2147483629

P$setup(cmd[-1L])
con <- file("stdin", "rb")
t0s <- numeric(0); t1s <- numeric(0); h1s <- numeric(0); h2s <- numeric(0)
kernel <- 0
mono0 <- mono()
wall0 <- as.numeric(Sys.time()) * 1e9
reason <- "budget"

repeat {
  if (input == "stream") {
    hdr <- readBin(con, "raw", 8L)
    if (length(hdr) < 8L) { cat("harness: input ended early\n", file = stderr()); quit(save = "no", status = 1L) }
    len <- sum(as.numeric(hdr) * 256^(0:7))
    data <- if (len > 0) readBin(con, "raw", len) else raw(0)
    if (length(data) < len) { cat("harness: input ended early\n", file = stderr()); quit(save = "no", status = 1L) }
  } else if (input == "file") {
    if (!file_ready) {
      if (system2(gen, c("file", pname, format(start + length(t0s), scientific = FALSE), file)) != 0L) {
        cat("harness: generator failed\n", file = stderr()); quit(save = "no", status = 1L)
      }
    }
    data <- charToRaw(file)
  } else {
    data <- raw(0)
  }
  inst <- P$decode(data)
  rm(data)
  t0 <- mono()
  res <- P$solve(inst)
  t1 <- mono()
  words <- P$emit(res)
  n <- length(words)
  h1 <- 17; h2 <- 19
  for (w in words) {
    h1 <- (h1 * 1000003 + w %% P1) %% P1
    h2 <- (h2 * 999983 + w %% P2) %% P2
  }
  h1 <- (h1 * 1000003 + n %% P1) %% P1
  h2 <- (h2 * 999983 + n %% P2) %% P2
  if (exists("release", envir = P, inherits = FALSE)) P$release(inst, res)
  rm(inst, res, words)
  if (input == "file" && !file_ready && file.exists(file)) file.remove(file)
  t0s <- c(t0s, t0); t1s <- c(t1s, t1); h1s <- c(h1s, h1); h2s <- c(h2s, h2)
  kernel <- kernel + (t1 - t0)
  if (max_iters > 0 && length(t0s) >= max_iters) { reason <- "iters"; break }
  if (kernel >= budget && length(t0s) >= min_iters) break
}

out <- c("LB 1 clock=proc.time(elapsed)", sprintf("START mono=%.0f wall=%.0f", mono0, wall0),
         sprintf("ITER %d t0=%.0f t1=%.0f check=%.0f:%.0f", seq_along(t0s), t0s, t1s, h1s, h2s),
         sprintf("DONE iters=%d kernel_ns=%.0f reason=%s", length(t0s), kernel, reason))
cat(out, sep = "\n")
cat("\n")
