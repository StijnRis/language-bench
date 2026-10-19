# conformance problem: sum, maximum and a checksum of 4096 int32 values
setup(args) = nothing
decode(data::Vector{UInt8}) = Vector{Int32}(reinterpret(Int32, data))

function solve(a::Vector{Int32})
    sum_ = 0
    mx = 0
    sq = 0
    for x in a
        v = Int(x)
        sum_ += v
        v > mx && (mx = v)
        sq = (sq + v * v) % 1000003
    end
    return [sum_, mx, sq, length(a)]
end

emit(r) = r
