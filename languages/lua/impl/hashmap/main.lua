local P = {}
function P.setup() end
function P.decode(data)
  local keys, lookups, unpack, pos = {}, {}, string.unpack, 1
  local n = #data // 8
  for i = 1, n do keys[i], pos = unpack("<i4", data, pos) end
  for i = 1, n do lookups[i], pos = unpack("<i4", data, pos) end
  return { keys, lookups }
end
function P.solve(inst)
  local keys, lookups = inst[1], inst[2]
  local m, distinct = {}, 0
  for i = 1, #keys do
    local k = keys[i]
    local c = m[k]
    if c then
      m[k] = c + 1
    else
      m[k] = 1
      distinct = distinct + 1
    end
  end
  local checksum = 0
  for k, c in pairs(m) do checksum = checksum + k * c end
  local hits = 0
  for i = 1, #lookups do hits = hits + (m[lookups[i]] or 0) end
  return { distinct, checksum, hits }
end
function P.emit(r) return r end
return P
