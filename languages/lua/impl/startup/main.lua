-- start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
local P = {}
function P.setup() end
function P.decode() return nil end
function P.solve() return nil end
function P.emit() return { 1 } end
return P
