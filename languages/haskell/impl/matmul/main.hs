{-# LANGUAGE BangPatterns #-}
module Problem (problem) where

import Contract
import Control.Exception (evaluate)
import Control.Monad (forM_)
import Data.Array.Base (unsafeAt, unsafeRead, unsafeWrite)
import Data.Array.IO (IOUArray, newArray)
import Data.Array.Unboxed (UArray, listArray)
import Data.Array.Unsafe (unsafeFreeze)
import qualified Data.ByteString as B
import qualified Data.ByteString.Unsafe as BU
import Data.Bits (shiftL, (.|.))
import Data.Int (Int32)
import Data.Word (Word64)
import GHC.Float (castWord64ToDouble)

le64 :: B.ByteString -> Int -> Double
le64 b off = castWord64ToDouble (foldr (\k acc -> (acc `shiftL` 8) .|. fromIntegral (BU.unsafeIndex b (off + k))) (0 :: Word64) [0 .. 7])

problem :: Problem
problem =
  Problem
    { pSetup = \_ -> return ()
    , pDecode = \dat -> do
        let n = fromIntegral (foldr (\k acc -> (acc `shiftL` 8) .|. fromIntegral (BU.unsafeIndex dat k)) (0 :: Int32) [0 .. 3]) :: Int
            mk off = listArray (0, n * n - 1) [le64 dat (4 + 8 * (off + i)) | i <- [0 .. n * n - 1]] :: UArray Int Double
        evaluate (n, mk 0, mk (n * n))
    , pSolve = \(n, a, b) -> do
        c <- newArray (0, n * n - 1) 0 :: IO (IOUArray Int Double)
        forM_ [0 .. n - 1] $ \i -> forM_ [0 .. n - 1] $ \k -> do
          let !aik = unsafeAt a (i * n + k)
              inner !j
                | j == n = return ()
                | otherwise = do
                    cij <- unsafeRead c (i * n + j)
                    unsafeWrite c (i * n + j) (cij + aik * unsafeAt b (k * n + j))
                    inner (j + 1)
          inner 0
        r <- unsafeFreeze c :: IO (UArray Int Double)
        evaluate (n, r)
    , pEmit = \(n, c) sink -> forM_ [0 .. n * n - 1] $ \i -> sink (floor (unsafeAt c i + 0.5))
    }
