{-# LANGUAGE BangPatterns #-}
module Problem (problem) where

import Contract
import Control.Concurrent (forkIO, newEmptyMVar, putMVar, setNumCapabilities, takeMVar)
import Control.Exception (evaluate)
import Data.IORef
import System.IO.Unsafe (unsafePerformIO)

{-# NOINLINE paramsRef #-}
paramsRef :: IORef (Int, Int)
paramsRef = unsafePerformIO (newIORef (2000000, 4))

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

problem :: Problem
problem =
  Problem
    { pSetup = \args -> case args of (a : b : _) -> writeIORef paramsRef (read a, read b); _ -> return ()
    , pDecode = \_ -> return ()
    , pSolve = \() -> do
        (n, workers) <- readIORef paramsRef
        setNumCapabilities workers
        vars <- mapM (\t -> do v <- newEmptyMVar; _ <- forkIO (evaluate (countPrimes n workers t) >>= putMVar v); return v) [0 .. workers - 1]
        parts <- mapM takeMVar vars
        return [sum parts]
    , pEmit = \r sink -> mapM_ sink r
    }
