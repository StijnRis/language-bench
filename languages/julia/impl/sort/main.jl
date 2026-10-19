setup(args) = nothing

decode(data::Vector{UInt8}) = Vector{Int32}(reinterpret(Int32, data))

function solve(a::Vector{Int32})
    sort!(a)
    return a
end

emit(a::Vector{Int32}) = a
