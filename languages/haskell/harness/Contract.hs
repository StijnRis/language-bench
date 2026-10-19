{-# LANGUAGE ExistentialQuantification #-}
-- The problem API of the Haskell harness (harness/CONTRACT.md): a problem is a record of operations over its own
-- instance and result types, which stay hidden from the harness.
module Contract (Problem (..)) where

import qualified Data.ByteString as B

data Problem = forall i r. Problem
  { pSetup :: [String] -> IO ()
  , pDecode :: B.ByteString -> IO i
  , pSolve :: i -> IO r
  , pEmit :: r -> (Int -> IO ()) -> IO ()
  }
