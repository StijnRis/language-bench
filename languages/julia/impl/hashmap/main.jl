function main()
    n = parse(Int, ARGS[1])
    x = Int64(1)
    m = Dict{Int64,Int64}()
    half = n ÷ 2
    for _ in 1:n
        x = x * 48271 % 2147483647
        k = x % half
        m[k] = get(m, k, 0) + 1
    end

    checksum = Int64(0)
    for (k, c) in m
        checksum += k * c
    end

    hits = Int64(0)
    for _ in 1:n
        x = x * 48271 % 2147483647
        hits += get(m, x % n, 0)
    end

    println("distinct=", length(m))
    println("checksum=", checksum)
    println("hits=", hits)
end

main()
