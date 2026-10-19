{-# LANGUAGE BangPatterns #-}
module Problem (problem) where

import Contract
import Control.Exception (evaluate)
import qualified Data.ByteString as B
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE

problem :: Problem
problem =
  Problem
    { pSetup = \_ -> return ()
    , pDecode = \dat -> evaluate (TE.decodeUtf8 dat)
    , pSolve = \text -> do
        let encoded = TE.encodeUtf8 (T.replace (T.pack " ") (T.pack "_") text)
            !checksum = B.foldl' (\acc w -> acc + fromIntegral w) (0 :: Int) encoded
            !bytes = B.length (TE.encodeUtf8 text)
            !cps = T.length text
            !spaces = T.count (T.pack " ") text
            !needle = T.count (T.pack "er") text
        evaluate [bytes, cps, spaces + 1, needle, checksum]
    , pEmit = \r sink -> mapM_ sink r
    }
