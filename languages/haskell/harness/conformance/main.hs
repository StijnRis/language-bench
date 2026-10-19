{-# LANGUAGE BangPatterns #-}
-- conformance problem: sum, maximum and a checksum of 4096 int32 values
module Problem (problem) where

import Contract
import Control.Exception (evaluate)
import Data.Bits (shiftL, (.|.))
import qualified Data.ByteString as B
import qualified Data.ByteString.Unsafe as BU
import Data.Int (Int32)
import Data.List (foldl')

le32 :: B.ByteString -> Int -> Int
le32 b i =
  let w k = fromIntegral (BU.unsafeIndex b (4 * i + k)) :: Int
   in fromIntegral (fromIntegral (w 0 .|. (w 1 `shiftL` 8) .|. (w 2 `shiftL` 16) .|. (w 3 `shiftL` 24)) :: Int32)

problem :: Problem
problem =
  Problem
    { pSetup = \_ -> return ()
    , pDecode = \dat -> evaluate [le32 dat i | i <- [0 .. B.length dat `div` 4 - 1]]
    , pSolve = \xs -> do
        let !s = sum xs
            !m = maximum (0 : xs)
            !sq = foldl' (\acc v -> (acc + v * v) `mod` 1000003) 0 xs
        evaluate [s, m, sq, length xs]
    , pEmit = \r sink -> mapM_ sink r
    }
