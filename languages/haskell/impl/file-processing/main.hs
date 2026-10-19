{-# LANGUAGE BangPatterns #-}
import qualified Data.ByteString.Char8 as B
import Data.List (foldl')
import qualified Data.Map.Strict as M
import System.Environment (getArgs)

main :: IO ()
main = do
  [path] <- getArgs
  content <- B.readFile path
  let step (!lines', !total, !freq) line =
        case B.split ',' line of
          [_, word, value] ->
            let Just (v, _) = B.readInt value
             in (lines' + 1, total + v, M.insertWith (+) word (1 :: Int) freq)
          _ -> (lines', total, freq)
      (lineCount, total, freq) = foldl' step (0 :: Int, 0 :: Int, M.empty) (B.lines content)
      better (w1, c1) (w2, c2) = if c2 > c1 || (c2 == c1 && w2 < w1) then (w2, c2) else (w1, c1)
      (top, topCount) = foldl' better (B.empty, -1) (M.toList freq)
  putStrLn ("lines=" ++ show lineCount)
  putStrLn ("sum=" ++ show total)
  putStrLn ("distinct=" ++ show (M.size freq))
  putStrLn ("top=" ++ B.unpack top ++ " " ++ show topCount)
