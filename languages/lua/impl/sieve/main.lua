local P = {}
local n_arg = 10000000
function P.setup(args) if #args > 0 then n_arg = math.tointeger(tonumber(args[1])) end end
function P.decode() return nil end
function P.solve()
  local n = n_arg
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
  return { count, last, sum }
end
function P.emit(r) return r end
return P
