function main()
    n = parse(Int, ARGS[1])
    a = Vector{Float64}(undef, n * n)
    b = Vector{Float64}(undef, n * n)
    c = zeros(Float64, n * n)
    for i in 0:(n - 1)
        for j in 0:(n - 1)
            a[i * n + j + 1] = Float64((i * 31 + j * 17) % 10 + 1)
            b[i * n + j + 1] = Float64((i * 13 + j * 7) % 10 - 4)
        end
    end

    for i in 0:(n - 1)
        for k in 0:(n - 1)
            aik = a[i * n + k + 1]
            for j in 0:(n - 1)
                c[i * n + j + 1] += aik * b[k * n + j + 1]
            end
        end
    end

    trace = 0.0
    total = 0.0
    for i in 0:(n - 1)
        trace += c[i * n + i + 1]
    end
    for v in c
        total += v
    end
    println("trace=", Int64(trace))
    println("sum=", Int64(total))
    println("c00=", Int64(c[1]))
    println("clast=", Int64(c[n * n]))
end

main()
