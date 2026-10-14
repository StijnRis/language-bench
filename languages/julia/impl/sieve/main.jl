function main()
    n = parse(Int, ARGS[1])
    s = fill(true, n + 1)
    s[1] = false
    s[2] = false
    p = 2
    while p * p <= n
        if s[p + 1]
            m = p * p
            while m <= n
                s[m + 1] = false
                m += p
            end
        end
        p += 1
    end
    count = 0
    last = 0
    total = 0
    for i in 2:n
        if s[i + 1]
            count += 1
            last = i
            total += i
        end
    end
    println("count=", count)
    println("last=", last)
    println("sum=", total)
end

main()
