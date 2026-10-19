-- Lua has no JSON parser in its standard library, so this is a small recursive-descent parser that
-- builds Lua tables (like the Rust and Haskell versions build their own values).
local P = {}
function P.setup() end
function P.decode(data) return data end -- the bytes are parsed inside solve

function P.solve(s)
  local byte, find, sub, match = string.byte, string.find, string.sub, string.match
  local NULL = setmetatable({}, { __tostring = function() return "null" end })
  local pos = 1

  local function skip()
    pos = find(s, "[^ \t\r\n]", pos) or #s + 1
  end

  local ESC = { [34] = '"', [92] = "\\", [47] = "/", [98] = "\b", [102] = "\f", [110] = "\n", [114] = "\r", [116] = "\t" }

  local function parse_string()
    pos = pos + 1 -- opening quote
    local start = pos
    local q = find(s, '["\\]', pos)
    if byte(s, q) == 34 then
      pos = q + 1
      return sub(s, start, q - 1)
    end
    local parts = {}
    while true do
      q = find(s, '["\\]', pos)
      parts[#parts + 1] = sub(s, pos, q - 1)
      if byte(s, q) == 34 then
        pos = q + 1
        break
      end
      local e = byte(s, q + 1)
      if e == 117 then -- \uXXXX
        parts[#parts + 1] = utf8.char(tonumber(sub(s, q + 2, q + 5), 16))
        pos = q + 6
      else
        parts[#parts + 1] = ESC[e]
        pos = q + 2
      end
    end
    return table.concat(parts)
  end

  local parse_value
  local function parse_array()
    pos = pos + 1
    local arr, n = {}, 0
    skip()
    if byte(s, pos) == 93 then pos = pos + 1; return arr end
    while true do
      n = n + 1
      arr[n] = parse_value()
      skip()
      local c = byte(s, pos)
      pos = pos + 1
      if c == 93 then return arr end
    end
  end

  local function parse_object()
    pos = pos + 1
    local obj = { __object = true }
    skip()
    if byte(s, pos) == 125 then pos = pos + 1; return obj end
    while true do
      skip()
      local k = parse_string()
      skip()
      pos = pos + 1 -- colon
      obj[k] = parse_value()
      skip()
      local c = byte(s, pos)
      pos = pos + 1
      if c == 125 then return obj end
    end
  end

  function parse_value()
    skip()
    local c = byte(s, pos)
    if c == 123 then return parse_object()
    elseif c == 91 then return parse_array()
    elseif c == 34 then return parse_string()
    elseif c == 116 then pos = pos + 4; return true
    elseif c == 102 then pos = pos + 5; return false
    elseif c == 110 then pos = pos + 4; return NULL
    else
      local num = match(s, "^-?%d+", pos)
      pos = pos + #num
      return math.tointeger(tonumber(num))
    end
  end

  local doc = parse_value()

  local objects, int_sum, str_len, trues, nulls = 0, 0, 0, 0, 0
  local stack, sp = { doc }, 1
  while sp > 0 do
    local v = stack[sp]
    stack[sp] = nil
    sp = sp - 1
    local t = type(v)
    if t == "table" then
      if v == NULL then
        nulls = nulls + 1
      elseif v.__object then
        objects = objects + 1
        for k, x in next, v do
          if k ~= "__object" then sp = sp + 1; stack[sp] = x end
        end
      else
        for i = 1, #v do sp = sp + 1; stack[sp] = v[i] end
      end
    elseif t == "string" then
      str_len = str_len + #v
    elseif t == "number" then
      int_sum = int_sum + v
    elseif v == true then
      trues = trues + 1
    end
  end

  return { objects, int_sum, str_len, trues, nulls }
end
function P.emit(r) return r end
return P
