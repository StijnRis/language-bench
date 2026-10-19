{-# LANGUAGE BangPatterns #-}
module Problem (problem) where

import Contract
import Control.Exception (evaluate)
import qualified Data.ByteString as B
import qualified Data.ByteString.Char8 as BC
import Data.List (foldl')
import qualified Data.Map.Strict as M

problem :: Problem
problem =
  Problem
    { pSetup = \_ -> return ()
    , pDecode = \dat -> return (BC.unpack dat) -- path of the file
    , pSolve = \path -> do
        content <- B.readFile path
        let step (!lines', !total, !freq) line =
              case BC.split ',' line of
                [_, word, value] ->
                  let Just (v, _) = BC.readInt value
                   in (lines' + 1, total + v, M.insertWith (+) word (1 :: Int) freq)
                _ -> (lines', total, freq)
            (lineCount, total, freq) = foldl' step (0 :: Int, 0 :: Int, M.empty) (BC.lines content)
            better (w1, c1) (w2, c2) = if c2 > c1 || (c2 == c1 && w2 < w1) then (w2, c2) else (w1, c1)
            (top, topCount) = foldl' better (B.empty, -1) (M.toList freq)
        evaluate ([lineCount, total, M.size freq, topCount, B.length top] ++ map fromIntegral (B.unpack top))
    , pEmit = \r sink -> mapM_ sink r
    }
