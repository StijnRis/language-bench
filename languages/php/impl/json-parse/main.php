<?php
final class Problem
{
    public static function setup(array $args): void
    {
    }

    public static function decode(string $data)
    {
        return $data; // the bytes are parsed inside solve
    }

    public static function solve($data)
    {
        $doc = json_decode($data);
        $objects = $intSum = $strLen = $trues = $nulls = 0;
        $stack = [$doc];
        while ($stack) {
            $v = array_pop($stack);
            if (is_object($v)) {
                $objects++;
                foreach ($v as $x) {
                    $stack[] = $x;
                }
            } elseif (is_array($v)) {
                foreach ($v as $x) {
                    $stack[] = $x;
                }
            } elseif (is_string($v)) {
                $strLen += strlen($v);
            } elseif ($v === true) {
                $trues++;
            } elseif ($v === null) {
                $nulls++;
            } elseif (is_int($v)) {
                $intSum += $v;
            }
        }
        return [$objects, $intSum, $strLen, $trues, $nulls];
    }

    public static function emit($r): array
    {
        return $r;
    }
}
