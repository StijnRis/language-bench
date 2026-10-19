-- language-bench harness for Lua: see harness/CONTRACT.md.
-- usage: lua harness.lua <problem.lua> [problem arguments]
-- The problem file returns a table with setup(args), decode(bytes), solve(instance),
-- emit(result) -> array of integers (the canonical result words) and optionally release(instance, result).
-- Lua's standard library has no wall clock of nanosecond resolution: time is os.clock (CPU time of this
-- process, microsecond resolution), which equals wall time for the single-threaded kernels; the parallel
-- kernel runs one share in this process so its CPU time follows the wall time as well.
local problem = dofile(arg[1])

local function num(k, d)
  local v = os.getenv(k)
  if v and v ~= "" then return tonumber(v) or d end
  return d
end
local function env(k, d)
  local v = os.getenv(k)
  if v and v ~= "" then return v end
  return d
end
local function mono() return math.floor(os.clock() * 1e9 + 0.5) end

local input = env("LB_INPUT", "none")
local budget = num("LB_BUDGET_SECONDS", 10) * 1e9
local min_iters = math.floor(num("LB_MIN_ITERS", 3))
local max_iters = math.floor(num("LB_MAX_ITERS", 0))
local start = math.floor(num("LB_START", 0))
local gen = env("LB_GEN", "/usr/local/bin/lbgen")
local file = env("LB_FILE", "/dev/shm/lb-input")
local pname = env("LB_PROBLEM", "")
local file_ready = os.getenv("LB_FILE_READY") ~= nil
local P1, P2 = 2147483647, 2147483629

local args = {}
for i = 2, #arg do args[#args + 1] = arg[i] end
problem.setup(args)

local rows = {}
local kernel = 0
local mono0 = mono()
local wall0 = os.time() * 1000000000
local reason = "budget"

while true do
  local data
  if input == "stream" then
    local hdr = io.read(8)
    if not hdr or #hdr < 8 then io.stderr:write("harness: input ended early\n"); os.exit(1) end
    local len = string.unpack("<I8", hdr)
    data = len > 0 and io.read(len) or ""
    if not data or #data < len then io.stderr:write("harness: input ended early\n"); os.exit(1) end
  elseif input == "file" then
    if not file_ready then
      local ok = os.execute(string.format("'%s' file %s %d '%s'", gen, pname, start + #rows, file))
      if not ok then io.stderr:write("harness: generator failed\n"); os.exit(1) end
    end
    data = file
  else
    data = ""
  end
  local inst = problem.decode(data)
  data = nil
  local t0 = mono()
  local res = problem.solve(inst)
  local t1 = mono()
  local h1, h2 = 17, 19
  local words = problem.emit(res)
  local n = #words
  for i = 1, n do
    local w = words[i]
    h1 = (h1 * 1000003 + w % P1) % P1
    h2 = (h2 * 999983 + w % P2) % P2
  end
  h1 = (h1 * 1000003 + n % P1) % P1
  h2 = (h2 * 999983 + n % P2) % P2
  if problem.release then problem.release(inst, res) end
  inst, res, words = nil, nil, nil
  if input == "file" and not file_ready then os.remove(file) end
  rows[#rows + 1] = { t0, t1, h1, h2 }
  kernel = kernel + (t1 - t0)
  if max_iters > 0 and #rows >= max_iters then reason = "iters"; break end
  if kernel >= budget and #rows >= min_iters then break end
end

local out = { "LB 1 clock=os.clock", string.format("START mono=%d wall=%d", mono0, wall0) }
for i, r in ipairs(rows) do
  out[#out + 1] = string.format("ITER %d t0=%d t1=%d check=%d:%d", i, r[1], r[2], r[3], r[4])
end
out[#out + 1] = string.format("DONE iters=%d kernel_ns=%d reason=%s", #rows, kernel, reason)
io.write(table.concat(out, "\n"), "\n")
