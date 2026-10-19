# non-ASCII characters are written as \u escapes so the result does not depend on the locale of the shell
vocab <- c("the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
           "über", "résumé", "привет", "мир",
           "код", "日本語", "世界", "速度", "hello", "world")

n <- as.integer(commandArgs(trailingOnly = TRUE)[1])
x <- 1
idx <- integer(n)
for (i in seq_len(n)) {
  x <- (x * 48271) %% 2147483647
  idx[i] <- x %% length(vocab) + 1
}
text <- paste(vocab[idx], collapse = " ")

encoded <- charToRaw(gsub(" ", "_", text, fixed = TRUE))
cat(sprintf("bytes=%d\n", nchar(text, type = "bytes")))
cat(sprintf("codepoints=%d\n", nchar(text, type = "chars")))
cat(sprintf("words=%d\n", length(strsplit(text, " ", fixed = TRUE)[[1L]])))
cat(sprintf("needle=%d\n", length(gregexpr("er", text, fixed = TRUE)[[1L]])))
cat(sprintf("checksum=%.0f\n", sum(as.numeric(encoded))))
