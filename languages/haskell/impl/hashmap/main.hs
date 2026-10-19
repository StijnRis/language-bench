{-# LANGUAGE BangPatterns #-}
import qualified Data.IntMap.Strict as M
import System.Environment (getArgs)

-- Data.IntMap (a Patricia tree from the containers package that ships with GHC) is the usual
-- integer-keyed map; the standard library has no hash table.
next :: Int -> Int
next x = x * 48271 `mod` 2147483647

main :: IO ()
main = do
  [arg] <- getArgs
  let n = read arg :: Int
      half = n `div` 2
      build :: Int -> Int -> M.IntMap Int -> (Int, M.IntMap Int)
      build !i !x !m
        | i == n = (x, m)
        | otherwise = let x' = next x in build (i + 1) x' (M.insertWith (+) (x' `mod` half) 1 m)
      (x1, m) = build 0 1 M.empty
      checksum = M.foldlWithKey' (\acc k c -> acc + k * c) 0 m
      probe :: Int -> Int -> Int -> Int
      probe !i !x !hits
        | i == n = hits
        | otherwise = let x' = next x in probe (i + 1) x' (hits + M.findWithDefault 0 (x' `mod` n) m)
  putStrLn ("distinct=" ++ show (M.size m))
  putStrLn ("checksum=" ++ show checksum)
  putStrLn ("hits=" ++ show (probe 0 x1 0))
