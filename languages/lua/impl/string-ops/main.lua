local P = {}
function P.setup() end
function P.decode(data) return data end -- Lua strings are byte strings; utf8.len counts code points
function P.solve(text)
  local needle = 0
  local p = string.find(text, "er", 1, true)
  while p do
    needle = needle + 1
    p = string.find(text, "er", p + 2, true)
  end
  local _, spaces = string.gsub(text, " ", "")
  local encoded = string.gsub(text, " ", "_")
  local checksum, byte = 0, string.byte
  for i = 1, #encoded do checksum = checksum + byte(encoded, i) end
  return { #text, utf8.len(text), spaces + 1, needle, checksum }
end
function P.emit(r) return r end
return P
