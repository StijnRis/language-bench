function main()
    n = parse(Int, ARGS[1])
    perm1 = collect(0:(n - 1))
    perm = zeros(Int, n)
    cnt = zeros(Int, n)
    maxflips = 0
    permcount = 0
    checksum = 0
    r = n
    while true
        while r != 1
            cnt[r] = r
            r -= 1
        end
        copyto!(perm, perm1)
        flips = 0
        k = perm[1]
        while k != 0
            i = 1
            j = k + 1
            while i < j
                perm[i], perm[j] = perm[j], perm[i]
                i += 1
                j -= 1
            end
            flips += 1
            k = perm[1]
        end
        maxflips = max(maxflips, flips)
        checksum += iseven(permcount) ? flips : -flips
        while true
            if r == n
                println("checksum=", checksum)
                println("maxflips=", maxflips)
                return
            end
            p0 = perm1[1]
            for i in 1:r
                perm1[i] = perm1[i + 1]
            end
            perm1[r + 1] = p0
            cnt[r + 1] -= 1
            cnt[r + 1] > 0 && break
            r += 1
        end
        permcount += 1
    end
end

main()
