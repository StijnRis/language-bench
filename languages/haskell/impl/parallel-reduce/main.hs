{-# LANGUAGE BangPatterns #-}
import Control.Concurrent (forkIO, newEmptyMVar, putMVar, setNumCapabilities, takeMVar)
import Control.Exception (evaluate)
import System.Environment (getArgs)

isPrime :: Int -> Bool
isPrime n
  | n < 2 = False
  | n < 4 = True
  | even n = False
  | otherwise = go 3
  where
    go !d
      | d * d > n = True
      | n `rem` d == 0 = False
      | otherwise = go (d + 2)

countPrimes :: Int -> Int -> Int -> Int
countPrimes n workers t = go t 0
  where
    go !i !acc
      | i >= n = acc
      | otherwise = go (i + workers) (if isPrime i then acc + 1 else acc)

main :: IO ()
main = do
  [a, b] <- getArgs
  let n = read a :: Int
      workers = read b :: Int
  setNumCapabilities workers
  vars <- mapM (\t -> do v <- newEmptyMVar; _ <- forkIO (evaluate (countPrimes n workers t) >>= putMVar v); return v) [0 .. workers - 1]
  parts <- mapM takeMVar vars
  putStrLn ("primes=" ++ show (sum parts))
