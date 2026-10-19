setup(args) = nothing

function decode(data::Vector{UInt8})
    all = Vector{Int32}(reinterpret(Int32, data))
    n = length(all) ÷ 2
    return (all[1:n], all[(n + 1):end])
end

function solve(inst)
    keys, lookups = inst
    m = Dict{Int32,Int}()
    for k in keys
        m[k] = get(m, k, 0) + 1
    end
    checksum = 0
    for (k, c) in m
        checksum += Int(k) * c
    end
    hits = 0
    for k in lookups
        hits += get(m, k, 0)
    end
    return [length(m), checksum, hits]
end

emit(r) = r
