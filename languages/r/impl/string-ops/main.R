setup <- function(args) NULL
decode <- function(data) {
  text <- rawToChar(data)
  Encoding(text) <- "UTF-8"
  text
}
solve <- function(text) {
  encoded <- charToRaw(gsub(" ", "_", text, fixed = TRUE))
  c(nchar(text, type = "bytes"), nchar(text, type = "chars"),
    sum(charToRaw(text) == as.raw(32L)) + 1,
    length(gregexpr("er", text, fixed = TRUE)[[1L]]),
    sum(as.numeric(encoded)))
}
emit <- function(r) as.numeric(r)
