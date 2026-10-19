# Base R has no JSON parser (jsonlite is a CRAN package). The document is tokenised with one regular
# expression, line by line, and the tokens are tallied; every record of the input is on its own line.
setup <- function(args) NULL
decode <- function(data) data   # the bytes are tokenised inside solve
solve <- function(data) {
  lines <- strsplit(rawToChar(data), "\n", fixed = TRUE)[[1L]]
  pattern <- "\"(?:[^\"\\\\]|\\\\.)*\"|-?[0-9]+|true|false|null|[{}\\[\\]:,]"
  objects <- 0; int_sum <- 0; str_len <- 0; trues <- 0; nulls <- 0
  for (line in lines) {
    tok <- regmatches(line, gregexpr(pattern, line, perl = TRUE))[[1L]]
    if (length(tok) == 0L) next
    objects <- objects + sum(tok == "{")
    trues <- trues + sum(tok == "true")
    nulls <- nulls + sum(tok == "null")
    first <- substr(tok, 1L, 1L)
    nums <- first == "-" | (first >= "0" & first <= "9")
    int_sum <- int_sum + sum(as.numeric(tok[nums]))
    is_str <- first == "\""
    # a string followed by ":" is an object key, not a value
    is_key <- is_str & c(tok[-1L] == ":", FALSE)
    vals <- tok[is_str & !is_key]
    if (length(vals)) {
      inner <- substr(vals, 2L, nchar(vals) - 1L)
      str_len <- str_len + sum(nchar(gsub("\\\\(u[0-9a-fA-F]{4}|.)", "x", inner, perl = TRUE)))
    }
  }
  c(objects, int_sum, str_len, trues, nulls)
}
emit <- function(r) r
