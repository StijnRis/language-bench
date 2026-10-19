{-# LANGUAGE BangPatterns #-}
{-# LANGUAGE OverloadedStrings #-}
import qualified Data.ByteString as B
import Data.List (foldl')
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE
import System.Environment (getArgs)

vocab :: [T.Text]
vocab =
  [ "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café"
  , "über", "résumé", "привет", "мир"
  , "код", "日本語", "世界", "速度", "hello", "world"
  ]

main :: IO ()
main = do
  [arg] <- getArgs
  let n = read arg :: Int
      table = vocab
      pick :: Int -> T.Text
      pick x = table !! (x `mod` length table)
      gen :: Int -> Int -> [T.Text]
      gen 0 _ = []
      gen k x = let x' = x * 48271 `mod` 2147483647 in pick x' : gen (k - 1) x'
      text = T.intercalate " " (gen n 1)
      encoded = TE.encodeUtf8 (T.replace " " "_" text)
      checksum = B.foldl' (\ !acc w -> acc + fromIntegral w) (0 :: Int) encoded
  putStrLn ("bytes=" ++ show (B.length (TE.encodeUtf8 text)))
  putStrLn ("codepoints=" ++ show (T.length text))
  putStrLn ("words=" ++ show (length (T.splitOn " " text)))
  putStrLn ("needle=" ++ show (T.count "er" text))
  putStrLn ("checksum=" ++ show checksum)
