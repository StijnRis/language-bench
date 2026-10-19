-- conformance problem: sum, maximum and a checksum of 4096 int32 values
local P = {}
function P.setup() end
function P.decode(data)
  local t, unpack, pos = {}, string.unpack, 1
  for i = 1, #data // 4 do t[i], pos = unpack("<i4", data, pos) end
  return t
end
function P.solve(a)
  local sum, mx, sq = 0, 0, 0
  for i = 1, #a do
    local v = a[i]
    sum = sum + v
    if v > mx then mx = v end
    sq = (sq + v * v) % 1000003
  end
  return { sum, mx, sq, #a }
end
function P.emit(r) return r end
return P
