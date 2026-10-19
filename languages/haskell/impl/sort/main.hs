import Data.List (sort, unfoldr)
import System.Environment (getArgs)

main :: IO ()
main = do
  [arg] <- getArgs
  let n = read arg :: Int
      step (0, _) = Nothing
      step (k, x) = let x' = x * 48271 `mod` 2147483647 in Just (x', (k - 1 :: Int, x'))
      sorted = sort (unfoldr step (n, 1 :: Int))   -- Data.List.sort: a merge sort on a linked list
      checksum = foldl (\acc (i, v) -> (acc + i * v) `mod` 1000000007) 0 (zip [0 ..] sorted)
  putStrLn ("first=" ++ show (head sorted))
  putStrLn ("last=" ++ show (last sorted))
  putStrLn ("median=" ++ show (sorted !! (n `div` 2)))
  putStrLn ("checksum=" ++ show checksum)
