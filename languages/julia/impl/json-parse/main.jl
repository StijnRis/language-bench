# Julia has no JSON parser in its standard library: a small recursive-descent parser that aggregates
# while parsing (it does not build a tree).
setup(args) = nothing
decode(data::Vector{UInt8}) = data   # the bytes are parsed inside solve

mutable struct State
    s::Vector{UInt8}
    i::Int
    objects::Int
    strLen::Int
    trues::Int
    nulls::Int
    intSum::Int
end

@inline function ws!(p::State)
    s = p.s
    while true
        c = s[p.i]
        (c == 0x20 || c == 0x0a || c == 0x0d || c == 0x09) || break
        p.i += 1
    end
end

function string!(p::State)
    s = p.s
    n = 0
    p.i += 1
    while true
        c = s[p.i]
        if c == UInt8('"')
            p.i += 1
            return n
        end
        if c == UInt8('\\')
            p.i += (s[p.i + 1] == UInt8('u')) ? 6 : 2
        else
            p.i += 1
        end
        n += 1
    end
end

function value!(p::State)
    ws!(p)
    s = p.s
    c = s[p.i]
    if c == UInt8('{')
        p.objects += 1
        p.i += 1
        ws!(p)
        if s[p.i] == UInt8('}')
            p.i += 1
            return
        end
        while true
            ws!(p)
            string!(p)
            ws!(p)
            p.i += 1 # ':'
            value!(p)
            ws!(p)
            d = s[p.i]
            p.i += 1
            d == UInt8('}') && return
        end
    elseif c == UInt8('[')
        p.i += 1
        ws!(p)
        if s[p.i] == UInt8(']')
            p.i += 1
            return
        end
        while true
            value!(p)
            ws!(p)
            d = s[p.i]
            p.i += 1
            d == UInt8(']') && return
        end
    elseif c == UInt8('"')
        p.strLen += string!(p)
    elseif c == UInt8('t')
        p.trues += 1
        p.i += 4
    elseif c == UInt8('f')
        p.i += 5
    elseif c == UInt8('n')
        p.nulls += 1
        p.i += 4
    else
        neg = c == UInt8('-')
        neg && (p.i += 1)
        v = 0
        while s[p.i] >= UInt8('0') && s[p.i] <= UInt8('9')
            v = v * 10 + Int(s[p.i] - UInt8('0'))
            p.i += 1
        end
        p.intSum += neg ? -v : v
    end
    return
end

function solve(data::Vector{UInt8})
    p = State(data, 1, 0, 0, 0, 0, 0)
    value!(p)
    return [p.objects, p.intSum, p.strLen, p.trues, p.nulls]
end

emit(r) = r
