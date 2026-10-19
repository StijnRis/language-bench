{-# LANGUAGE BangPatterns #-}
-- language-bench harness for Haskell: see harness/CONTRACT.md. Built together with Contract.hs and Problem.hs
-- (the problem's main.hs), which exports `problem :: Problem`.
module Main (main) where

import Contract
import Control.Monad (when)
import qualified Data.ByteString as B
import qualified Data.ByteString.Char8 as BC
import qualified Data.ByteString.Unsafe as BU
import Data.IORef
import Data.Time.Clock.POSIX (getPOSIXTime)
import GHC.Clock (getMonotonicTimeNSec)
import Numeric (readFloat)
import System.Directory (doesFileExist, removeFile)
import System.Environment (getArgs, lookupEnv)
import System.Exit (exitFailure)
import System.IO
import System.Process (callProcess)
import Problem (problem)

num :: String -> Double -> IO Double
num k d = do
  v <- lookupEnv k
  return $ case v of
    Just s@(_ : _) -> case readFloat s of [(x, "")] -> x; _ -> d
    _ -> d

envs :: String -> String -> IO String
envs k d = do
  v <- lookupEnv k
  return $ case v of Just s@(_ : _) -> s; _ -> d

mono :: IO Int
mono = fromIntegral <$> getMonotonicTimeNSec

readFull :: Int -> IO B.ByteString
readFull n = do
  b <- B.hGet stdin n
  when (B.length b < n) $ hPutStrLn stderr "harness: input ended early" >> exitFailure
  return b

p1, p2 :: Int
p1 = 2147483647
p2 = 2147483629

main :: IO ()
main = do
  hSetBinaryMode stdin True
  input <- envs "LB_INPUT" "none"
  budget <- (* 1e9) <$> num "LB_BUDGET_SECONDS" 10
  minIters <- round <$> num "LB_MIN_ITERS" 3
  maxIters <- round <$> num "LB_MAX_ITERS" 0
  start <- round <$> num "LB_START" 0 :: IO Int
  gen <- envs "LB_GEN" "/usr/local/bin/lbgen"
  file <- envs "LB_FILE" "/dev/shm/lb-input"
  pname <- envs "LB_PROBLEM" ""
  fileReady <- maybe False (const True) <$> lookupEnv "LB_FILE_READY"
  args <- getArgs
  case problem of
    Problem setup decode solve emit -> do
      setup args
      rows <- newIORef ([] :: [(Int, Int, Int, Int)])
      count <- newIORef (0 :: Int)
      kernel <- newIORef (0 :: Double)
      mono0 <- mono
      wall0 <- (\t -> floor (realToFrac t * 1e9 :: Double)) <$> getPOSIXTime :: IO Int
      let loop = do
            i <- readIORef count
            dat <- case input of
              "stream" -> do
                hdr <- readFull 8
                let len = foldr (\k acc -> acc * 256 + fromIntegral (BU.unsafeIndex hdr k)) 0 [0 .. 7] :: Int
                readFull len
              "file" -> do
                when (not fileReady) $ callProcess gen ["file", pname, show (start + i), file]
                return (BC.pack file)
              _ -> return B.empty
            inst <- decode dat
            t0 <- mono
            res <- solve inst
            t1 <- mono
            h1 <- newIORef (17 :: Int)
            h2 <- newIORef (19 :: Int)
            n <- newIORef (0 :: Int)
            let mix !w = do
                  let m1 = ((w `rem` p1) + p1) `rem` p1
                      m2 = ((w `rem` p2) + p2) `rem` p2
                  modifyIORef' h1 (\h -> (h * 1000003 + m1) `rem` p1)
                  modifyIORef' h2 (\h -> (h * 999983 + m2) `rem` p2)
            emit res (\w -> mix w >> modifyIORef' n (+ 1))
            nn <- readIORef n
            mix nn
            a <- readIORef h1
            b <- readIORef h2
            when (input == "file" && not fileReady) $ do
              e <- doesFileExist file
              when e (removeFile file)
            modifyIORef' rows ((t0, t1, a, b) :)
            writeIORef count (i + 1)
            modifyIORef' kernel (+ fromIntegral (t1 - t0))
            k <- readIORef kernel
            if maxIters > 0 && i + 1 >= maxIters
              then return "iters"
              else if k >= budget && i + 1 >= minIters then return "budget" else loop
      reason <- loop
      rs <- reverse <$> readIORef rows
      k <- readIORef kernel
      let out =
            ["LB 1 clock=GHC.Clock.getMonotonicTimeNSec", "START mono=" ++ show mono0 ++ " wall=" ++ show wall0]
              ++ [ "ITER " ++ show j ++ " t0=" ++ show t0 ++ " t1=" ++ show t1 ++ " check=" ++ show a ++ ":" ++ show b
                 | (j, (t0, t1, a, b)) <- zip [1 :: Int ..] rs
                 ]
              ++ ["DONE iters=" ++ show (length rs) ++ " kernel_ns=" ++ show (round k :: Int) ++ " reason=" ++ reason]
      putStr (unlines out)
      hFlush stdout
