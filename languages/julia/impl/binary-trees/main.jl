# Binary trees, after the Computer Language Benchmarks Game.
depth_arg = 14
setup(args) = (isempty(args) || (global depth_arg = parse(Int, args[1])); nothing)

struct Node
    left::Union{Node,Nothing}
    right::Union{Node,Nothing}
end

make(d::Int) = d == 0 ? Node(nothing, nothing) : Node(make(d - 1), make(d - 1))

function check(t::Node)::Int
    l = t.left
    l === nothing ? 1 : 1 + check(l) + check(t.right::Node)
end

decode(data) = nothing

function solve(_)
    min_depth = 4
    max_depth = max(min_depth + 2, depth_arg)
    out = Int[check(make(max_depth + 1))]
    long_lived = make(max_depth)
    for depth in min_depth:2:max_depth
        iterations = 1 << (max_depth - depth + min_depth)
        total = 0
        for _ in 1:iterations
            total += check(make(depth))
        end
        push!(out, iterations, total)
    end
    push!(out, check(long_lived))
    return out
end

emit(r) = r
