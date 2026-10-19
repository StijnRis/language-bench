n_arg, workers_arg = 2_000_000, 4
setup(args) = (length(args) > 1 && (global n_arg = parse(Int, args[1]); global workers_arg = parse(Int, args[2])); nothing)
decode(data) = nothing

function isprime_(n::Int)
    n < 2 && return false
    n < 4 && return true
    n % 2 == 0 && return false
    d = 3
    while d * d <= n
        n % d == 0 && return false
        d += 2
    end
    return true
end

function share(t::Int, n::Int, workers::Int)
    count = 0
    i = t
    while i < n
        isprime_(i) && (count += 1)
        i += workers
    end
    return count
end

function solve(_)
    n, workers = n_arg, workers_arg
    tasks = [Threads.@spawn(share(t, n, workers)) for t in 0:(workers - 1)]
    return [sum(fetch(t) for t in tasks)]
end

emit(r) = r
