function main()
    freq = Dict{String,Int}()
    lines = 0
    total = 0
    for line in eachline(ARGS[1])
        c1 = findfirst(',', line)::Int
        c2 = findnext(',', line, c1 + 1)::Int
        word = line[(c1 + 1):(c2 - 1)]
        total += parse(Int, SubString(line, c2 + 1))
        freq[word] = get(freq, word, 0) + 1
        lines += 1
    end

    top = ""
    topCount = -1
    for (w, c) in freq
        if c > topCount || (c == topCount && w < top)
            top = w
            topCount = c
        end
    end

    println("lines=", lines)
    println("sum=", total)
    println("distinct=", length(freq))
    println("top=", top, " ", topCount)
end

main()
