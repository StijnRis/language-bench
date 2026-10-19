-- Binary trees, after the Computer Language Benchmarks Game.
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

local n = tonumber(arg[1])
local min_depth = 4
local max_depth = math.max(min_depth + 2, n)
local stretch_depth = max_depth + 1

print(string.format("stretch tree of depth %d\t check: %d", stretch_depth, check_tree(make_tree(stretch_depth))))
local long_lived = make_tree(max_depth)

for depth = min_depth, max_depth, 2 do
  local iterations = 1 << (max_depth - depth + min_depth)
  local check = 0
  for _ = 1, iterations do
    check = check + check_tree(make_tree(depth))
  end
  print(string.format("%d\t trees of depth %d\t check: %d", iterations, depth, check))
end

print(string.format("long lived tree of depth %d\t check: %d", max_depth, check_tree(long_lived)))
