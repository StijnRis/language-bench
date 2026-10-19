setup(args) = nothing

function decode(data::Vector{UInt8})
    n = Int(reinterpret(Int32, data[1:4])[1])
    vals = reinterpret(Float64, data[5:end])
    a = permutedims(reshape(Vector{Float64}(vals[1:(n * n)]), n, n))   # row-major input
    b = permutedims(reshape(Vector{Float64}(vals[(n * n + 1):end]), n, n))
    return (n, collect(a), collect(b))
end

function solve(inst)
    n, a, b = inst
    c = zeros(Float64, n, n)
    @inbounds for i in 1:n
        for k in 1:n
            aik = a[i, k]
            for j in 1:n
                c[i, j] += aik * b[k, j]
            end
        end
    end
    return c
end

emit(c) = [floor(Int, c[i, j] + 0.5) for i in 1:size(c, 1) for j in 1:size(c, 2)]
