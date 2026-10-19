local P = {}
function P.setup() end
function P.decode(data)
  local t, unpack, pos = {}, string.unpack, 1
  for i = 1, #data // 4 do t[i], pos = unpack("<i4", data, pos) end
  return t
end
function P.solve(a)
  table.sort(a)
  return a
end
function P.emit(a) return a end
return P
