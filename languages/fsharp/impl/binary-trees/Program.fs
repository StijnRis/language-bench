// Binary trees, after the Computer Language Benchmarks Game (plain objects, .NET garbage collector).
module Problem

[<AllowNullLiteral>]
type Node(left: Node, right: Node) =
    member _.Left = left
    member _.Right = right

let mutable depthArg = 14

let rec make (d: int) : Node =
    if d = 0 then Node(null, null) else Node(make (d - 1), make (d - 1))

let rec check (n: Node) : int64 =
    if isNull n.Left then 1L else 1L + check n.Left + check n.Right

let setup (args: string[]) =
    if args.Length > 0 then depthArg <- int args.[0]

let decode (data: byte[]) : obj = null

let solve (inst: obj) : obj =
    let minDepth = 4
    let maxDepth = max (minDepth + 2) depthArg
    let out = System.Collections.Generic.List<int64>()
    out.Add(check (make (maxDepth + 1)))
    let longLived = make maxDepth
    let mutable depth = minDepth
    while depth <= maxDepth do
        let iterations = 1L <<< (maxDepth - depth + minDepth)
        let mutable sum = 0L
        let mutable i = 0L
        while i < iterations do
            sum <- sum + check (make depth)
            i <- i + 1L
        out.Add iterations
        out.Add sum
        depth <- depth + 2
    out.Add(check longLived)
    box out

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<System.Collections.Generic.List<int64>> res do
        sink v

let release (inst: obj) (res: obj) = ()
