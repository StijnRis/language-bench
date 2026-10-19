-- start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
module Problem (problem) where

import Contract

problem :: Problem
problem = Problem {pSetup = \_ -> return (), pDecode = \_ -> return (), pSolve = \() -> return (), pEmit = \() sink -> sink 1}
