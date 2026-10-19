-- Binary trees, after the Computer Language Benchmarks Game.
{-# LANGUAGE BangPatterns #-}
-- without these flags GHC shares `check (make depth)` between loop iterations and builds each tree only once
{-# OPTIONS_GHC -fno-full-laziness -fno-cse #-}
import Data.Bits (shiftL)
import System.Environment (getArgs)
import Text.Printf (printf)

data Tree = Leaf | Node !Tree !Tree

make :: Int -> Tree
make 0 = Leaf
make d = Node (make (d - 1)) (make (d - 1))

check :: Tree -> Int
check Leaf = 1
check (Node l r) = 1 + check l + check r

main :: IO ()
main = do
  [arg] <- getArgs
  let n = read arg :: Int
      minDepth = 4
      maxDepth = max (minDepth + 2) n
      stretch = maxDepth + 1
  printf "stretch tree of depth %d\t check: %d\n" stretch (check (make stretch))
  let longLived = make maxDepth
  mapM_
    ( \depth -> do
        let iterations = 1 `shiftL` (maxDepth - depth + minDepth) :: Int
            go :: Int -> Int -> Int
            go !i !acc = if i == 0 then acc else go (i - 1) (acc + check (make depth))
        printf "%d\t trees of depth %d\t check: %d\n" iterations depth (go iterations 0)
    )
    [minDepth, minDepth + 2 .. maxDepth]
  printf "long lived tree of depth %d\t check: %d\n" maxDepth (check longLived)
