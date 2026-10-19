local VOCAB = {
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
  "über", "résumé", "привет", "мир",
  "код", "日本語", "世界", "速度", "hello", "world",
}

local n = tonumber(arg[1])
local x = 1
local words = {}
for i = 1, n do
  x = x * 48271 % 2147483647
  words[i] = VOCAB[x % #VOCAB + 1]
end
local text = table.concat(words, " ")

local bytes = #text
local codepoints = utf8.len(text)

local needle = 0
local p = string.find(text, "er", 1, true)
while p do
  needle = needle + 1
  p = string.find(text, "er", p + 2, true)
end

local _, spaces = string.gsub(text, " ", "")
local nwords = spaces + 1

local encoded = string.gsub(text, " ", "_")
local checksum = 0
local byte = string.byte
for i = 1, #encoded do checksum = checksum + byte(encoded, i) end

print("bytes=" .. bytes)
print("codepoints=" .. codepoints)
print("words=" .. nwords)
print("needle=" .. needle)
print("checksum=" .. checksum)
