// Binary trees, after the Computer Language Benchmarks Game (plain objects, .NET garbage collector).
module Program

[<AllowNullLiteral>]
type Node(left: Node, right: Node) =
    member _.Left = left
    member _.Right = right

let rec make (d: int) : Node =
    if d = 0 then Node(null, null) else Node(make (d - 1), make (d - 1))

let rec check (n: Node) : int64 =
    if isNull n.Left then 1L else 1L + check n.Left + check n.Right

[<EntryPoint>]
let main argv =
    let n = int argv.[0]
    let minDepth = 4
    let maxDepth = max (minDepth + 2) n
    let stretch = maxDepth + 1
    printfn "stretch tree of depth %d\t check: %d" stretch (check (make stretch))
    let longLived = make maxDepth
    let mutable depth = minDepth
    while depth <= maxDepth do
        let iterations = 1L <<< (maxDepth - depth + minDepth)
        let mutable sum = 0L
        let mutable i = 0L
        while i < iterations do
            sum <- sum + check (make depth)
            i <- i + 1L
        printfn "%d\t trees of depth %d\t check: %d" iterations depth sum
        depth <- depth + 2
    printfn "long lived tree of depth %d\t check: %d" maxDepth (check longLived)
    0
