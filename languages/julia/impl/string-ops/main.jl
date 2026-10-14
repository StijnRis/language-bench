const VOCAB = [
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world",
]

function main()
    n = parse(Int, ARGS[1])
    x = Int64(1)
    words = Vector{String}(undef, n)
    for i in 1:n
        x = x * 48271 % 2147483647
        words[i] = VOCAB[x % length(VOCAB) + 1]
    end
    text = join(words, " ")

    codepoints = length(text)

    needle = 0
    r = findnext("er", text, 1)
    while r !== nothing
        needle += 1
        r = findnext("er", text, last(r) + 1)
    end

    checksum = sum(Int, codeunits(replace(text, " " => "_")))

    println("bytes=", ncodeunits(text))
    println("codepoints=", codepoints)
    println("words=", length(split(text, " ")))
    println("needle=", needle)
    println("checksum=", checksum)
end

main()
