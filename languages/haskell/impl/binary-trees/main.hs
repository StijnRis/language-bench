-- Binary trees, after the Computer Language Benchmarks Game.
{-# LANGUAGE BangPatterns #-}
-- without these flags GHC shares `check (make depth)` between loop iterations and builds each tree only once
{-# OPTIONS_GHC -fno-full-laziness -fno-cse #-}
module Problem (problem) where

import Contract
import Control.Exception (evaluate)
import Data.Bits (shiftL)
import Data.IORef
import System.IO.Unsafe (unsafePerformIO)

data Tree = Leaf | Node !Tree !Tree

{-# NOINLINE depthRef #-}
depthRef :: IORef Int
depthRef = unsafePerformIO (newIORef 14)

make :: Int -> Tree
make 0 = Leaf
make d = Node (make (d - 1)) (make (d - 1))

check :: Tree -> Int
check Leaf = 1
check (Node l r) = 1 + check l + check r

problem :: Problem
problem =
  Problem
    { pSetup = \args -> case args of (a : _) -> writeIORef depthRef (read a); _ -> return ()
    , pDecode = \_ -> return ()
    , pSolve = \() -> do
        n <- readIORef depthRef
        let minDepth = 4
            maxDepth = max (minDepth + 2) n
            stretch = maxDepth + 1
        !s <- evaluate (check (make stretch))
        let longLived = make maxDepth
            go :: Int -> Int -> Int -> Int
            go !depth !i !acc = if i == 0 then acc else go depth (i - 1) (acc + check (make depth))
        rest <-
          mapM
            ( \depth -> do
                let iterations = 1 `shiftL` (maxDepth - depth + minDepth) :: Int
                !c <- evaluate (go depth iterations 0)
                return [iterations, c]
            )
            [minDepth, minDepth + 2 .. maxDepth]
        !ll <- evaluate (check longLived)
        return (s : concat rest ++ [ll])
    , pEmit = \r sink -> mapM_ sink r
    }
