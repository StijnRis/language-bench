local P = {}
local n_arg = 9
function P.setup(args) if #args > 0 then n_arg = math.tointeger(tonumber(args[1])) end end
function P.decode() return nil end
function P.solve()
  local n = n_arg
  local perm1, count, perm = {}, {}, {}
  for i = 0, n - 1 do perm1[i] = i; count[i] = 0 end
  local maxflips, permcount, checksum = 0, 0, 0
  local r = n
  while true do
    while r ~= 1 do
      count[r - 1] = r
      r = r - 1
    end
    for i = 0, n - 1 do perm[i] = perm1[i] end
    local flips = 0
    local k = perm[0]
    while k ~= 0 do
      local i, j = 0, k
      while i < j do
        perm[i], perm[j] = perm[j], perm[i]
        i = i + 1
        j = j - 1
      end
      flips = flips + 1
      k = perm[0]
    end
    if flips > maxflips then maxflips = flips end
    if permcount % 2 == 0 then checksum = checksum + flips else checksum = checksum - flips end
    while true do
      if r == n then return { checksum, maxflips } end
      local p0 = perm1[0]
      for i = 0, r - 1 do perm1[i] = perm1[i + 1] end
      perm1[r] = p0
      count[r] = count[r] - 1
      if count[r] > 0 then break end
      r = r + 1
    end
    permcount = permcount + 1
  end
end
function P.emit(r) return r end
return P
