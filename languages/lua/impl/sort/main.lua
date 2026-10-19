local n = tonumber(arg[1])
local x = 1
local a = {}
for i = 1, n do
  x = x * 48271 % 2147483647
  a[i] = x
end

table.sort(a)

local checksum = 0
for i = 1, n do
  checksum = (checksum + (i - 1) * a[i]) % 1000000007
end

print("first=" .. a[1])
print("last=" .. a[n])
print("median=" .. a[n // 2 + 1])
print("checksum=" .. checksum)
