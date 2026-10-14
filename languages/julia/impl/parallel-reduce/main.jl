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

function worker(t::Int, n::Int, workers::Int)
    count = 0
    i = t
    while i < n
        isprime_(i) && (count += 1)
        i += workers
    end
    return count
end

function main()
    n = parse(Int, ARGS[1])
    workers = parse(Int, ARGS[2])
    tasks = [Threads.@spawn(worker(t, n, workers)) for t in 0:(workers - 1)]
    total = 0
    for t in tasks
        total += fetch(t)
    end
    println("primes=", total)
end

main()
