# language-bench harness for Julia: see harness/CONTRACT.md.
# usage: julia -t 4 harness.jl <problem.jl> [problem arguments]
# The problem file defines setup(args), decode(bytes), solve(instance), emit(result) -> Vector{Int}
# (the canonical result words) and optionally release(instance, result). It is included at run time, so its
# functions are called through invokelatest.
const P = Module(:Problem)
Base.include(P, abspath(ARGS[1]))

num(k, d) = (v = get(ENV, k, ""); isempty(v) ? d : something(tryparse(Float64, v), d))
envs(k, d) = (v = get(ENV, k, ""); isempty(v) ? d : v)
mono() = Int(time_ns())

function readfull(io, n::Int)
    n == 0 && return UInt8[]
    buf = read(io, n)
    if length(buf) < n
        println(stderr, "harness: input ended early")
        exit(1)
    end
    return buf
end

function main()
    input = envs("LB_INPUT", "none")
    budget = num("LB_BUDGET_SECONDS", 10.0) * 1e9
    min_iters = Int(num("LB_MIN_ITERS", 3.0))
    max_iters = Int(num("LB_MAX_ITERS", 0.0))
    start = Int(num("LB_START", 0.0))
    gen = envs("LB_GEN", "/usr/local/bin/lbgen")
    file = envs("LB_FILE", "/dev/shm/lb-input")
    pname = envs("LB_PROBLEM", "")
    file_ready = haskey(ENV, "LB_FILE_READY")
    p1, p2 = 2147483647, 2147483629

    Base.invokelatest(P.setup, ARGS[2:end])
    rows = Tuple{Int,Int,Int,Int}[]
    kernel = 0
    mono0 = mono()
    wall0 = round(Int, time() * 1e9)
    reason = "budget"

    while true
        data = UInt8[]
        if input == "stream"
            hdr = readfull(stdin, 8)
            data = readfull(stdin, Int(reinterpret(UInt64, hdr)[1]))
        elseif input == "file"
            if !file_ready
                run(`$gen file $pname $(start + length(rows)) $file`)
            end
            data = Vector{UInt8}(codeunits(file))
        end
        inst = Base.invokelatest(P.decode, data)
        t0 = mono()
        res = Base.invokelatest(P.solve, inst)
        t1 = mono()
        h1, h2, n = 17, 19, 0
        for w in Base.invokelatest(P.emit, res)
            h1 = (h1 * 1000003 + mod(w, p1)) % p1
            h2 = (h2 * 999983 + mod(w, p2)) % p2
            n += 1
        end
        h1 = (h1 * 1000003 + mod(n, p1)) % p1
        h2 = (h2 * 999983 + mod(n, p2)) % p2
        inst = nothing
        res = nothing
        if input == "file" && !file_ready && isfile(file)
            rm(file)
        end
        push!(rows, (t0, t1, h1, h2))
        kernel += t1 - t0
        if max_iters > 0 && length(rows) >= max_iters
            reason = "iters"
            break
        end
        kernel >= budget && length(rows) >= min_iters && break
    end

    io = IOBuffer()
    println(io, "LB 1 clock=time_ns\nSTART mono=$mono0 wall=$wall0")
    for (i, r) in enumerate(rows)
        println(io, "ITER $i t0=$(r[1]) t1=$(r[2]) check=$(r[3]):$(r[4])")
    end
    println(io, "DONE iters=$(length(rows)) kernel_ns=$kernel reason=$reason")
    write(stdout, take!(io))
    flush(stdout)
end

main()
