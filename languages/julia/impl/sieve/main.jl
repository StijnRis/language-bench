n_arg = 10_000_000
setup(args) = (isempty(args) || (global n_arg = parse(Int, args[1])); nothing)
decode(data) = nothing

function solve(_)
    n = n_arg
    composite = zeros(Bool, n)
    p = 2
    while p * p <= n
        if !composite[p]
            for m in (p * p):p:n
                composite[m] = true
            end
        end
        p += 1
    end
    count = 0
    last = 0
    total = 0
    for i in 2:n
        if !composite[i]
            count += 1
            last = i
            total += i
        end
    end
    return [count, last, total]
end

emit(r) = r
