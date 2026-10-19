{-# LANGUAGE BangPatterns #-}
import Control.Monad (when)
import Data.Array.Base (unsafeAt, unsafeRead, unsafeWrite)
import Data.Array.ST (newArray, runSTUArray)
import Data.Array.Unboxed (UArray)
import Data.Word (Word8)
import System.Environment (getArgs)

main :: IO ()
main = do
  [arg] <- getArgs
  let n = read arg :: Int
      composite :: UArray Int Word8
      composite = runSTUArray $ do
        arr <- newArray (0, n) 0
        let outer !p = when (p * p <= n) $ do
              v <- unsafeRead arr p
              when (v == 0) $ inner (p * p) p
              outer (p + 1)
            inner !m !p = when (m <= n) $ unsafeWrite arr m 1 >> inner (m + p) p
        outer 2
        return arr
      go !i !count !lst !total
        | i > n = (count, lst, total)
        | unsafeAt composite i == 0 = go (i + 1) (count + 1) i (total + i)
        | otherwise = go (i + 1) count lst total
      (count, lst, total) = go 2 (0 :: Int) 0 (0 :: Int)
  putStrLn ("count=" ++ show count)
  putStrLn ("last=" ++ show lst)
  putStrLn ("sum=" ++ show total)
