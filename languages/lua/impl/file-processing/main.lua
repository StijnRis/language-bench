local lines, total, distinct = 0, 0, 0
local freq = {}
for line in io.lines(arg[1]) do
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
  if c > top_count or (c == top_count and w < top) then
    top, top_count = w, c
  end
end

print("lines=" .. lines)
print("sum=" .. total)
print("distinct=" .. distinct)
print("top=" .. top .. " " .. top_count)
