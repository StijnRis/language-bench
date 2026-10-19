path <- commandArgs(trailingOnly = TRUE)[1]
cols <- scan(path, what = list(NULL, "", 0), sep = ",", quiet = TRUE, comment.char = "")
words <- cols[[2L]]
freq <- table(words)
top <- order(-as.integer(freq), names(freq), method = "radix")[1L]

cat(sprintf("lines=%d\n", length(words)))
cat(sprintf("sum=%.0f\n", sum(cols[[3L]])))
cat(sprintf("distinct=%d\n", length(freq)))
cat(sprintf("top=%s %d\n", names(freq)[top], as.integer(freq)[top]))
