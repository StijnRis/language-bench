-- Lua has no threads: like Python, Ruby and PHP here, the workers are separate processes
-- (this script started again with `worker`) whose results are read back through pipes.
local function is_prime(n)
  if n < 2 then return false end
  if n < 4 then return true end
  if n % 2 == 0 then return false end
  local d = 3
  while d * d <= n do
    if n % d == 0 then return false end
    d = d + 2
  end
  return true
end

if arg[1] == "worker" then
  local n, workers, t = tonumber(arg[2]), tonumber(arg[3]), tonumber(arg[4])
  local count = 0
  for i = t, n - 1, workers do
    if is_prime(i) then count = count + 1 end
  end
  print(count)
  os.exit(0)
end

local n, workers = tonumber(arg[1]), tonumber(arg[2])
local interpreter = arg[-1] or "lua"
local pipes = {}
for t = 0, workers - 1 do
  pipes[t] = assert(io.popen(string.format("%s %s worker %d %d %d", interpreter, arg[0], n, workers, t), "r"))
end
local total = 0
for t = 0, workers - 1 do
  total = total + tonumber(pipes[t]:read("l"))
  pipes[t]:close()
end
print("primes=" .. total)
