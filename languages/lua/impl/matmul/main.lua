local P = {}
function P.setup() end
function P.decode(data)
  local n = string.unpack("<i4", data)
  local a, b, unpack, pos = {}, {}, string.unpack, 5
  for i = 1, n do
    local row = {}
    for j = 1, n do row[j], pos = unpack("<d", data, pos) end
    a[i] = row
  end
  for i = 1, n do
    local row = {}
    for j = 1, n do row[j], pos = unpack("<d", data, pos) end
    b[i] = row
  end
  return { n, a, b }
end
function P.solve(inst)
  local n, a, b = inst[1], inst[2], inst[3]
  local c = {}
  for i = 1, n do
    local ci, ai = {}, a[i]
    for j = 1, n do ci[j] = 0.0 end
    for k = 1, n do
      local aik, bk = ai[k], b[k]
      for j = 1, n do ci[j] = ci[j] + aik * bk[j] end
    end
    c[i] = ci
  end
  return c
end
function P.emit(c)
  local out, floor = {}, math.floor
  for i = 1, #c do
    local row = c[i]
    for j = 1, #row do out[#out + 1] = floor(row[j] + 0.5) end
  end
  return out
end
return P
