<?php
// conformance problem: sum, maximum and a checksum of 4096 int32 values
final class Problem
{
    public static function setup(array $args): void
    {
    }

    public static function decode(string $data)
    {
        return array_values(unpack("l*", $data));
    }

    public static function solve($a)
    {
        $sq = 0;
        foreach ($a as $v) {
            $sq = ($sq + $v * $v) % 1000003;
        }
        return [array_sum($a), max($a), $sq, count($a)];
    }

    public static function emit($r): array
    {
        return $r;
    }
}
