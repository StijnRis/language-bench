{-# LANGUAGE BangPatterns #-}
import Control.Monad (forM_, when)
import Data.Array.Base (unsafeRead, unsafeWrite)
import Data.Array.IO (IOUArray, newListArray, newArray)
import System.Environment (getArgs)
import System.Exit (exitSuccess)

main :: IO ()
main = do
  [arg] <- getArgs
  let n = read arg :: Int
  perm1 <- newListArray (0, n - 1) [0 .. n - 1] :: IO (IOUArray Int Int)
  perm <- newArray (0, n - 1) 0 :: IO (IOUArray Int Int)
  count <- newArray (0, n - 1) 0 :: IO (IOUArray Int Int)

  let flipsOf :: IO Int
      flipsOf = do
        forM_ [0 .. n - 1] $ \i -> unsafeRead perm1 i >>= unsafeWrite perm i
        let loop !flips = do
              k <- unsafeRead perm 0
              if k == 0
                then return flips
                else do
                  let rev !i !j = when (i < j) $ do
                        a <- unsafeRead perm i
                        b <- unsafeRead perm j
                        unsafeWrite perm i b
                        unsafeWrite perm j a
                        rev (i + 1) (j - 1)
                  rev 0 k
                  loop (flips + 1)
        loop 0

      outer :: Int -> Int -> Int -> Int -> IO ()
      outer !r0 !maxflips !permcount !checksum = do
        let fill !r = if r /= 1 then unsafeWrite count (r - 1) r >> fill (r - 1) else return r
        r <- fill r0
        flips <- flipsOf
        let maxflips' = max maxflips flips
            checksum' = if even permcount then checksum + flips else checksum - flips
            advance !r' = do
              when (r' == n) $ do
                putStrLn ("checksum=" ++ show checksum')
                putStrLn ("maxflips=" ++ show maxflips')
                exitSuccess
              p0 <- unsafeRead perm1 0
              forM_ [0 .. r' - 1] $ \i -> unsafeRead perm1 (i + 1) >>= unsafeWrite perm1 i
              unsafeWrite perm1 r' p0
              c <- unsafeRead count r'
              unsafeWrite count r' (c - 1)
              if c - 1 > 0 then return r' else advance (r' + 1)
        r' <- advance r
        outer r' maxflips' (permcount + 1) checksum'
  outer n 0 0 0
