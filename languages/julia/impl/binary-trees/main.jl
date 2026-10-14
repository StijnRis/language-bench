# Binary trees, after the Computer Language Benchmarks Game.
struct Node
    left::Union{Node,Nothing}
    right::Union{Node,Nothing}
end

make(d::Int) = d == 0 ? Node(nothing, nothing) : Node(make(d - 1), make(d - 1))

function check(t::Node)::Int
    l = t.left
    l === nothing ? 1 : 1 + check(l) + check(t.right::Node)
end

function main()
    n = parse(Int, ARGS[1])
    minDepth = 4
    maxDepth = max(minDepth + 2, n)
    stretch = maxDepth + 1

    println("stretch tree of depth ", stretch, "\t check: ", check(make(stretch)))
    longLived = make(maxDepth)

    for depth in minDepth:2:maxDepth
        iterations = 1 << (maxDepth - depth + minDepth)
        total = 0
        for _ in 1:iterations
            total += check(make(depth))
        end
        println(iterations, "\t trees of depth ", depth, "\t check: ", total)
    end

    println("long lived tree of depth ", maxDepth, "\t check: ", check(longLived))
end

main()
