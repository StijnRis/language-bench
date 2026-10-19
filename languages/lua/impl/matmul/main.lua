local n = tonumber(arg[1])
local a, b, c = {}, {}, {}
for i = 1, n do
  local ai, bi, ci = {}, {}, {}
  for j = 1, n do
    ai[j] = ((i - 1) * 31 + (j - 1) * 17) % 10 + 1.0
    bi[j] = ((i - 1) * 13 + (j - 1) * 7) % 10 - 4.0
    ci[j] = 0.0
  end
  a[i], b[i], c[i] = ai, bi, ci
end

for i = 1, n do
  local ci, ai = c[i], a[i]
  for k = 1, n do
    local aik, bk = ai[k], b[k]
    for j = 1, n do
      ci[j] = ci[j] + aik * bk[j]
    end
  end
end

local trace, total = 0.0, 0.0
for i = 1, n do
  trace = trace + c[i][i]
  local ci = c[i]
  for j = 1, n do total = total + ci[j] end
end
print(string.format("trace=%d", math.tointeger(trace)))
print(string.format("sum=%d", math.tointeger(total)))
print(string.format("c00=%d", math.tointeger(c[1][1])))
print(string.format("clast=%d", math.tointeger(c[n][n])))
