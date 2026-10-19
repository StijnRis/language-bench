{-# LANGUAGE BangPatterns #-}
-- GHC ships no JSON library (aeson is not a boot package), so this is a small recursive-descent parser.
module Problem (problem) where

import Contract
import Control.Exception (evaluate)
import qualified Data.ByteString as B
import qualified Data.ByteString.Unsafe as BU
import Data.Word (Word8)

data Value
  = Obj [Value]
  | Arr [Value]
  | Str !Int
  | Num !Int
  | Bool !Bool
  | Null

at :: B.ByteString -> Int -> Word8
at = BU.unsafeIndex

skip :: B.ByteString -> Int -> Int
skip s !i = if i < B.length s && (let c = at s i in c == 32 || c == 10 || c == 13 || c == 9) then skip s (i + 1) else i

-- returns the length in characters of the unescaped string and the index after the closing quote
parseString :: B.ByteString -> Int -> (Int, Int)
parseString s i0 = go (i0 + 1) 0
  where
    go !i !len = case at s i of
      34 -> (len, i + 1)
      92 -> case at s (i + 1) of
        117 -> go (i + 6) (len + 1) -- \uXXXX (ASCII input: counted as one character)
        _ -> go (i + 2) (len + 1)
      _ -> go (i + 1) (len + 1)

parseValue :: B.ByteString -> Int -> (Value, Int)
parseValue s i0 =
  let i = skip s i0
   in case at s i of
        123 -> parseObject s (skip s (i + 1)) []
        91 -> parseArray s (skip s (i + 1)) []
        34 -> let (len, j) = parseString s i in (Str len, j)
        116 -> (Bool True, i + 4)
        102 -> (Bool False, i + 5)
        110 -> (Null, i + 4)
        _ -> parseNumber s i

parseNumber :: B.ByteString -> Int -> (Value, Int)
parseNumber s i =
  let neg = at s i == 45
      start = if neg then i + 1 else i
      go !j !acc = if j < B.length s && at s j >= 48 && at s j <= 57 then go (j + 1) (acc * 10 + fromIntegral (at s j) - 48) else (acc, j)
      (v, end) = go start 0
   in (Num (if neg then negate v else v), end)

parseArray :: B.ByteString -> Int -> [Value] -> (Value, Int)
parseArray s i acc
  | at s i == 93 = (Arr (reverse acc), i + 1)
  | otherwise =
      let (v, j) = parseValue s i
          j' = skip s j
       in case at s j' of
            44 -> parseArray s (skip s (j' + 1)) (v : acc)
            _ -> (Arr (reverse (v : acc)), j' + 1)

parseObject :: B.ByteString -> Int -> [Value] -> (Value, Int)
parseObject s i acc
  | at s i == 125 = (Obj (reverse acc), i + 1)
  | otherwise =
      let (_, j) = parseString s i -- key
          j' = skip s j + 1 -- colon
          (v, k) = parseValue s j'
          k' = skip s k
       in case at s k' of
            44 -> parseObject s (skip s (k' + 1)) (v : acc)
            _ -> (Obj (reverse (v : acc)), k' + 1)

data Stats = Stats !Int !Int !Int !Int !Int

walk :: Stats -> [Value] -> Stats
walk !st [] = st
walk st@(Stats o i l t n) (v : rest) = case v of
  Obj vs -> walk (Stats (o + 1) i l t n) (vs ++ rest)
  Arr vs -> walk st (vs ++ rest)
  Str len -> walk (Stats o i (l + len) t n) rest
  Num x -> walk (Stats o (i + x) l t n) rest
  Bool True -> walk (Stats o i l (t + 1) n) rest
  Bool False -> walk st rest
  Null -> walk (Stats o i l t (n + 1)) rest

problem :: Problem
problem =
  Problem
    { pSetup = \_ -> return ()
    , pDecode = return -- the bytes are parsed inside solve
    , pSolve = \s -> do
        let (doc, _) = parseValue s 0
            !(Stats objects intSum strLen trues nulls) = walk (Stats 0 0 0 0 0) [doc]
        evaluate [objects, intSum, strLen, trues, nulls]
    , pEmit = \r sink -> mapM_ sink r
    }
