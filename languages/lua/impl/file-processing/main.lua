local P = {}
function P.setup() end
function P.decode(data) return data end -- path of the file
function P.solve(path)
  local lines, total, distinct = 0, 0, 0
  local freq = {}
  for line in io.lines(path) do
    local word, value = line:match("^[^,]*,([^,]*),(%d+)$")
    lines = lines + 1
    total = total + tonumber(value)
    local c = freq[word]
    if c then
      freq[word] = c + 1
    else
      freq[word] = 1
      distinct = distinct + 1
    end
  end
  local top, top_count = nil, -1
  for w, c in pairs(freq) do
    if c > top_count or (c == top_count and w < top) then top, top_count = w, c end
  end
  return { lines, total, distinct, top_count, top }
end
function P.emit(r)
  local out = { r[1], r[2], r[3], r[4], #r[5] }
  for i = 1, #r[5] do out[#out + 1] = r[5]:byte(i) end
  return out
end
return P
