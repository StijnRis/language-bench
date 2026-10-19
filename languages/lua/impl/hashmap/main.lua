local n = tonumber(arg[1])
local x = 1
local m = {}
local distinct = 0
local half = n // 2
for _ = 1, n do
  x = x * 48271 % 2147483647
  local k = x % half
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
for _ = 1, n do
  x = x * 48271 % 2147483647
  hits = hits + (m[x % n] or 0)
end

print("distinct=" .. distinct)
print("checksum=" .. checksum)
print("hits=" .. hits)
