n_arg = 9
setup(args) = (isempty(args) || (global n_arg = parse(Int, args[1])); nothing)
decode(data) = nothing

function solve(_)
    n = n_arg
    perm1 = collect(0:(n - 1))
    perm = zeros(Int, n)
    count = zeros(Int, n)
    maxflips = 0
    permcount = 0
    checksum = 0
    r = n
    while true
        while r != 1
            count[r] = r
            r -= 1
        end
        copyto!(perm, perm1)
        flips = 0
        k = perm[1]
        while k != 0
            reverse!(perm, 1, k + 1)
            flips += 1
            k = perm[1]
        end
        flips > maxflips && (maxflips = flips)
        checksum += iseven(permcount) ? flips : -flips
        while true
            r == n && return [checksum, maxflips]
            p0 = perm1[1]
            for i in 1:r
                perm1[i] = perm1[i + 1]
            end
            perm1[r + 1] = p0
            count[r + 1] -= 1
            count[r + 1] > 0 && break
            r += 1
        end
        permcount += 1
    end
end

emit(r) = r
