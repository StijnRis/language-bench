local n = tonumber(arg[1])
local s = {}
for i = 0, n do s[i] = 1 end
s[0], s[1] = 0, 0
local p = 2
while p * p <= n do
  if s[p] == 1 then
    for m = p * p, n, p do s[m] = 0 end
  end
  p = p + 1
end

local count, last, sum = 0, 0, 0
for i = 2, n do
  if s[i] == 1 then
    count = count + 1
    last = i
    sum = sum + i
  end
end
print("count=" .. count)
print("last=" .. last)
print("sum=" .. sum)
