{-# LANGUAGE BangPatterns #-}
module Problem (problem) where

import Contract
import Control.Monad (when)
import Data.Array.Base (unsafeAt, unsafeRead, unsafeWrite)
import Data.Array.ST (newArray, runSTUArray)
import Data.Array.Unboxed (UArray)
import Data.IORef
import Data.Word (Word8)
import System.IO.Unsafe (unsafePerformIO)

{-# NOINLINE nRef #-}
nRef :: IORef Int
nRef = unsafePerformIO (newIORef 10000000)

problem :: Problem
problem =
  Problem
    { pSetup = \args -> case args of (a : _) -> writeIORef nRef (read a); _ -> return ()
    , pDecode = \_ -> return ()
    , pSolve = \() -> do
        n <- readIORef nRef
        let composite :: UArray Int Word8
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
            !(c, l, t) = go 2 (0 :: Int) 0 (0 :: Int)
        return [c, l, t]
    , pEmit = \r sink -> mapM_ sink r
    }
