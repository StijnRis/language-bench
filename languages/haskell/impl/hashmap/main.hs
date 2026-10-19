{-# LANGUAGE BangPatterns #-}
module Problem (problem) where

import Contract
import Control.Exception (evaluate)
import Data.Array.Unboxed (UArray, bounds, elems, listArray)
import Data.Bits (shiftL, (.|.))
import qualified Data.ByteString as B
import qualified Data.ByteString.Unsafe as BU
import Data.Int (Int32)
import qualified Data.IntMap.Strict as M
import Data.List (foldl')

-- Data.IntMap (a Patricia tree from the containers package that ships with GHC) is the usual
-- integer-keyed map; the standard library has no hash table.
le32 :: B.ByteString -> Int -> Int
le32 b i =
  let w k = fromIntegral (BU.unsafeIndex b (4 * i + k)) :: Int
   in fromIntegral (fromIntegral (w 0 .|. (w 1 `shiftL` 8) .|. (w 2 `shiftL` 16) .|. (w 3 `shiftL` 24)) :: Int32)

problem :: Problem
problem =
  Problem
    { pSetup = \_ -> return ()
    , pDecode = \dat -> do
        let n = B.length dat `div` 8
            mk off = listArray (0, n - 1) [le32 dat (off + i) | i <- [0 .. n - 1]] :: UArray Int Int
        evaluate (mk 0, mk n)
    , pSolve = \(keys, lookups) -> do
        let !m = foldl' (\acc k -> M.insertWith (+) k (1 :: Int) acc) M.empty (elems keys)
            !checksum = M.foldlWithKey' (\acc k c -> acc + k * c) 0 m
            !hits = foldl' (\acc k -> acc + M.findWithDefault 0 k m) 0 (elems lookups)
        evaluate [M.size m, checksum, hits]
    , pEmit = \r sink -> mapM_ sink r
    }
