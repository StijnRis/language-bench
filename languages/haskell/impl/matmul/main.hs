{-# LANGUAGE BangPatterns #-}
import Control.Monad (forM_)
import Data.Array.Base (unsafeRead, unsafeWrite)
import Data.Array.IO (IOUArray, newArray)
import System.Environment (getArgs)

main :: IO ()
main = do
  [arg] <- getArgs
  let n = read arg :: Int
  a <- newArray (0, n * n - 1) 0 :: IO (IOUArray Int Double)
  b <- newArray (0, n * n - 1) 0 :: IO (IOUArray Int Double)
  c <- newArray (0, n * n - 1) 0 :: IO (IOUArray Int Double)
  forM_ [0 .. n - 1] $ \i -> forM_ [0 .. n - 1] $ \j -> do
    unsafeWrite a (i * n + j) (fromIntegral ((i * 31 + j * 17) `mod` 10 + 1))
    unsafeWrite b (i * n + j) (fromIntegral ((i * 13 + j * 7) `mod` 10 - 4))
  forM_ [0 .. n - 1] $ \i -> forM_ [0 .. n - 1] $ \k -> do
    aik <- unsafeRead a (i * n + k)
    let inner !j
          | j == n = return ()
          | otherwise = do
              bkj <- unsafeRead b (k * n + j)
              cij <- unsafeRead c (i * n + j)
              unsafeWrite c (i * n + j) (cij + aik * bkj)
              inner (j + 1)
    inner 0
  let sumRange :: Int -> Int -> Int -> Double -> IO Double
      sumRange !lo !hi !step !acc
        | lo >= hi = return acc
        | otherwise = unsafeRead c lo >>= \v -> sumRange (lo + step) hi step (acc + v)
  trace <- sumRange 0 (n * n) (n + 1) 0
  total <- sumRange 0 (n * n) 1 0
  c00 <- unsafeRead c 0
  clast <- unsafeRead c (n * n - 1)
  putStrLn ("trace=" ++ show (truncate trace :: Int))
  putStrLn ("sum=" ++ show (truncate total :: Int))
  putStrLn ("c00=" ++ show (truncate c00 :: Int))
  putStrLn ("clast=" ++ show (truncate clast :: Int))
