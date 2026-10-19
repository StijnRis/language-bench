setup <- function(args) NULL
decode <- function(data) rawToChar(data)   # path of the file
solve <- function(path) {
  cols <- scan(path, what = list(NULL, "", 0), sep = ",", quiet = TRUE, comment.char = "")
  words <- cols[[2L]]
  freq <- table(words)
  top <- order(-as.integer(freq), names(freq), method = "radix")[1L]
  list(length(words), sum(cols[[3L]]), length(freq), as.integer(freq)[top], names(freq)[top])
}
emit <- function(r) c(r[[1L]], r[[2L]], r[[3L]], r[[4L]], nchar(r[[5L]]), as.numeric(charToRaw(r[[5L]])))
