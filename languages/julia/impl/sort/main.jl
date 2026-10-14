function main()
    n = parse(Int, ARGS[1])
    x = Int64(1)
    a = Vector{Int32}(undef, n)
    for i in 1:n
        x = x * 48271 % 2147483647
        a[i] = Int32(x)
    end

    sort!(a)

    checksum = Int64(0)
    for i in 1:n
        checksum = (checksum + Int64(i - 1) * a[i]) % 1000000007
    end

    println("first=", a[1])
    println("last=", a[n])
    println("median=", a[n ÷ 2 + 1])
    println("checksum=", checksum)
end

main()
