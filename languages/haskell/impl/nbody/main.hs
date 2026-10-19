-- N-body simulation, after the Computer Language Benchmarks Game.
{-# LANGUAGE BangPatterns #-}
module Problem (problem) where

import Contract
import Control.Monad (forM_, when)
import Data.Array.Base (unsafeRead, unsafeWrite)
import Data.Array.IO (IOUArray, newListArray)
import Data.Bits (shiftL, (.|.))
import qualified Data.ByteString as B
import qualified Data.ByteString.Unsafe as BU
import Data.IORef
import Data.Word (Word64)
import GHC.Float (castWord64ToDouble)
import System.IO.Unsafe (unsafePerformIO)

{-# NOINLINE stepsRef #-}
stepsRef :: IORef Int
stepsRef = unsafePerformIO (newIORef 1000000)

solarMass :: Double
solarMass = 4 * pi * pi

nb :: Int
nb = 5

le64 :: B.ByteString -> Int -> Double
le64 b off = castWord64ToDouble (foldr (\k acc -> (acc `shiftL` 8) .|. fromIntegral (BU.unsafeIndex b (off + k))) (0 :: Word64) [0 .. 7])

energy :: IOUArray Int Double -> IO Double
energy s = go 0 0
  where
    rd = unsafeRead s
    go !i !e
      | i == nb = return e
      | otherwise = do
          vx <- rd (7 * i + 3); vy <- rd (7 * i + 4); vz <- rd (7 * i + 5); m <- rd (7 * i + 6)
          e2 <- inner i (i + 1) (e + 0.5 * m * (vx * vx + vy * vy + vz * vz))
          go (i + 1) e2
    inner !i !j !e
      | j == nb = return e
      | otherwise = do
          x1 <- rd (7 * i); y1 <- rd (7 * i + 1); z1 <- rd (7 * i + 2); m1 <- rd (7 * i + 6)
          x2 <- rd (7 * j); y2 <- rd (7 * j + 1); z2 <- rd (7 * j + 2); m2 <- rd (7 * j + 6)
          let dx = x1 - x2; dy = y1 - y2; dz = z1 - z2
          inner i (j + 1) (e - m1 * m2 / sqrt (dx * dx + dy * dy + dz * dz))

advance :: IOUArray Int Double -> Double -> IO ()
advance s dt = do
  forM_ [0 .. nb - 1] $ \i -> forM_ [i + 1 .. nb - 1] $ \j -> do
    x1 <- rd (7 * i); y1 <- rd (7 * i + 1); z1 <- rd (7 * i + 2); m1 <- rd (7 * i + 6)
    x2 <- rd (7 * j); y2 <- rd (7 * j + 1); z2 <- rd (7 * j + 2); m2 <- rd (7 * j + 6)
    let dx = x1 - x2; dy = y1 - y2; dz = z1 - z2
        d2 = dx * dx + dy * dy + dz * dz
        mag = dt / (d2 * sqrt d2)
        bm = m1 * mag
        cm = m2 * mag
    upd (7 * i + 3) (subtract (dx * cm)); upd (7 * i + 4) (subtract (dy * cm)); upd (7 * i + 5) (subtract (dz * cm))
    upd (7 * j + 3) (+ dx * bm); upd (7 * j + 4) (+ dy * bm); upd (7 * j + 5) (+ dz * bm)
  forM_ [0 .. nb - 1] $ \i -> do
    vx <- rd (7 * i + 3); vy <- rd (7 * i + 4); vz <- rd (7 * i + 5)
    upd (7 * i) (+ dt * vx); upd (7 * i + 1) (+ dt * vy); upd (7 * i + 2) (+ dt * vz)
  where
    rd = unsafeRead s
    upd k f = unsafeRead s k >>= unsafeWrite s k . f

problem :: Problem
problem =
  Problem
    { pSetup = \args -> case args of (a : _) -> writeIORef stepsRef (read a); _ -> return ()
    , pDecode = \dat -> newListArray (0, 7 * nb - 1) [le64 dat (8 * i) | i <- [0 .. 7 * nb - 1]] :: IO (IOUArray Int Double)
    , pSolve = \s -> do
        steps <- readIORef stepsRef
        let momentum k = sum <$> mapM (\i -> (*) <$> unsafeRead s (7 * i + 3 + k) <*> unsafeRead s (7 * i + 6)) [0 .. nb - 1]
        forM_ [0, 1, 2] $ \k -> do
          p <- momentum k
          unsafeWrite s (3 + k) (negate p / solarMass)
        !e0 <- energy s
        let loop !i = when (i < steps) $ advance s 0.01 >> loop (i + 1)
        loop 0
        !e1 <- energy s
        return (e0, e1)
    , pEmit = \(e0, e1) sink -> sink (floor (e0 * 1e9 + 0.5)) >> sink (floor (e1 * 1e9 + 0.5))
    }
