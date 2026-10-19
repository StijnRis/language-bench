-- Lua has no threads: like Python, Ruby and PHP here, the workers are separate processes (this file started
-- again with `worker`) whose results are read back through pipes. The harness's clock is CPU time, so this
-- process computes one share itself while the others run: its CPU time then follows the wall time.
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

local function share(n, workers, t)
  local count = 0
  for i = t, n - 1, workers do
    if is_prime(i) then count = count + 1 end
  end
  return count
end

-- started as a worker process: `lua main.lua worker <n> <workers> <t>`
if arg and arg[1] == "worker" then
  print(share(math.tointeger(tonumber(arg[2])), math.tointeger(tonumber(arg[3])), math.tointeger(tonumber(arg[4]))))
  os.exit(0)
end

local P = {}
local n_arg, workers_arg = 2000000, 4
local script
function P.setup(args)
  if #args > 1 then n_arg, workers_arg = math.tointeger(tonumber(args[1])), math.tointeger(tonumber(args[2])) end
  script = debug.getinfo(1, "S").source:sub(2) -- path of this file
end
function P.decode() return nil end
function P.solve()
  local n, workers = n_arg, workers_arg
  local interpreter = arg[-1] or "lua"
  local pipes = {}
  for t = 1, workers - 1 do
    pipes[t] = assert(io.popen(string.format("%s %s worker %d %d %d", interpreter, script, n, workers, t), "r"))
  end
  local total = share(n, workers, 0)
  for t = 1, workers - 1 do
    total = total + tonumber(pipes[t]:read("l"))
    pipes[t]:close()
  end
  return { total }
end
function P.emit(r) return r end
return P
