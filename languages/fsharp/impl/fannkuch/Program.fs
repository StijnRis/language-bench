module Program

[<EntryPoint>]
let main argv =
    let n = int argv.[0]
    let perm1 = Array.init n id
    let perm = Array.zeroCreate<int> n
    let count = Array.zeroCreate<int> n
    let mutable maxflips = 0
    let mutable permcount = 0
    let mutable checksum = 0L
    let mutable r = n
    let mutable fin = false
    while not fin do
        while r <> 1 do
            count.[r - 1] <- r
            r <- r - 1
        System.Array.Copy(perm1, perm, n)
        let mutable flips = 0
        let mutable k = perm.[0]
        while k <> 0 do
            let mutable i = 0
            let mutable j = k
            while i < j do
                let t = perm.[i]
                perm.[i] <- perm.[j]
                perm.[j] <- t
                i <- i + 1
                j <- j - 1
            flips <- flips + 1
            k <- perm.[0]
        if flips > maxflips then maxflips <- flips
        checksum <- checksum + (if permcount % 2 = 0 then int64 flips else -(int64 flips))
        let mutable searching = true
        while searching && not fin do
            if r = n then
                printfn "checksum=%d" checksum
                printfn "maxflips=%d" maxflips
                fin <- true
            else
                let p0 = perm1.[0]
                for i in 0 .. r - 1 do
                    perm1.[i] <- perm1.[i + 1]
                perm1.[r] <- p0
                count.[r] <- count.[r] - 1
                if count.[r] > 0 then searching <- false else r <- r + 1
        permcount <- permcount + 1
    0
