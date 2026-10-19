-- Binary trees, after the Computer Language Benchmarks Game.
local P = {}
local depth_arg = 14
function P.setup(args) if #args > 0 then depth_arg = math.tointeger(tonumber(args[1])) end end
function P.decode() return nil end

local function make_tree(d)
  if d == 0 then return {} end
  d = d - 1
  return { make_tree(d), make_tree(d) }
end
local function check_tree(node)
  local left = node[1]
  if left == nil then return 1 end
  return 1 + check_tree(left) + check_tree(node[2])
end

function P.solve()
  local min_depth = 4
  local max_depth = math.max(min_depth + 2, depth_arg)
  local out = { check_tree(make_tree(max_depth + 1)) }
  local long_lived = make_tree(max_depth)
  for depth = min_depth, max_depth, 2 do
    local iterations = 1 << (max_depth - depth + min_depth)
    local check = 0
    for _ = 1, iterations do check = check + check_tree(make_tree(depth)) end
    out[#out + 1] = iterations
    out[#out + 1] = check
  end
  out[#out + 1] = check_tree(long_lived)
  return out
end
function P.emit(r) return r end
return P
