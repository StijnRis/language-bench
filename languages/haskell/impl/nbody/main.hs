-- N-body simulation, after the Computer Language Benchmarks Game.
{-# LANGUAGE BangPatterns #-}
import Control.Monad (forM_, when)
import Data.Array.Base (unsafeRead, unsafeWrite)
import Data.Array.IO (IOUArray, newListArray)
import System.Environment (getArgs)
import Text.Printf (printf)

solarMass, days :: Double
solarMass = 4 * pi * pi
days = 365.24

-- body i: x y z vx vy vz mass at 7*i .. 7*i+6
initial :: [Double]
initial =
  [ 0, 0, 0, 0, 0, 0, solarMass
  , 4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01, 1.66007664274403694e-03 * days, 7.69901118419740425e-03 * days, -6.90460016972063023e-05 * days, 9.54791938424326609e-04 * solarMass
  , 8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01, -2.76742510726862411e-03 * days, 4.99852801234917238e-03 * days, 2.30417297573763929e-05 * days, 2.85885980666130812e-04 * solarMass
  , 1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01, 2.96460137564761618e-03 * days, 2.37847173959480950e-03 * days, -2.96589568540237556e-05 * days, 4.36624404335156298e-05 * solarMass
  , 1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01, 2.68067772490389322e-03 * days, 1.62824170038242295e-03 * days, -9.51592254519715870e-05 * days, 5.15138902046611451e-05 * solarMass
  ]

nb :: Int
nb = 5

energy :: IOUArray Int Double -> IO Double
energy s = go 0 0
  where
    rd = unsafeRead s
    go !i !e
      | i == nb = return e
      | otherwise = do
          vx <- rd (7 * i + 3); vy <- rd (7 * i + 4); vz <- rd (7 * i + 5); m <- rd (7 * i + 6)
          let e1 = e + 0.5 * m * (vx * vx + vy * vy + vz * vz)
          e2 <- inner i (i + 1) e1
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

main :: IO ()
main = do
  [arg] <- getArgs
  let steps = read arg :: Int
  s <- newListArray (0, 7 * nb - 1) initial :: IO (IOUArray Int Double)
  let momentum k = sum <$> mapM (\i -> (*) <$> unsafeRead s (7 * i + 3 + k) <*> unsafeRead s (7 * i + 6)) [0 .. nb - 1]
  forM_ [0, 1, 2] $ \k -> do
    p <- momentum k
    unsafeWrite s (3 + k) (negate p / solarMass)
  energy s >>= printf "%.9f\n"
  let loop !i = when (i < steps) $ advance s 0.01 >> loop (i + 1)
  loop 0
  energy s >>= printf "%.9f\n"
