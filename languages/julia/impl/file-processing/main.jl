setup(args) = nothing
decode(data) = String(data)   # path of the file

function solve(path::String)
    freq = Dict{String,Int}()
    lines = 0
    total = 0
    for line in eachline(path)
        c1 = findfirst(',', line)::Int
        c2 = findnext(',', line, c1 + 1)::Int
        word = line[(c1 + 1):(c2 - 1)]
        total += parse(Int, SubString(line, c2 + 1))
        freq[word] = get(freq, word, 0) + 1
        lines += 1
    end
    top = ""
    top_count = -1
    for (w, c) in freq
        if c > top_count || (c == top_count && w < top)
            top = w
            top_count = c
        end
    end
    return (lines, total, length(freq), top_count, top)
end

emit(r) = vcat([r[1], r[2], r[3], r[4], sizeof(r[5])], Int.(codeunits(r[5])))
