setup(args) = nothing

decode(data::Vector{UInt8}) = String(data)

function solve(text::String)
    spaces = count(==(' '), text)
    needle = 0
    r = findfirst("er", text)
    while r !== nothing
        needle += 1
        r = findnext("er", text, last(r) + 1)
    end
    checksum = sum(Int, codeunits(replace(text, ' ' => '_')))
    return [sizeof(text), length(text), spaces + 1, needle, checksum]
end

emit(r) = r
