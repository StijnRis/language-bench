<?php
final class Problem
{
    public static function setup(array $args): void
    {
    }

    public static function decode(string $data)
    {
        $a = array_values(unpack("l*", $data));
        $n = intdiv(count($a), 2);
        return [array_slice($a, 0, $n), array_slice($a, $n)];
    }

    public static function solve($inst)
    {
        [$keys, $lookups] = $inst;
        $m = [];
        foreach ($keys as $k) {
            $m[$k] = ($m[$k] ?? 0) + 1;
        }
        $checksum = 0;
        foreach ($m as $k => $c) {
            $checksum += $k * $c;
        }
        $hits = 0;
        foreach ($lookups as $k) {
            $hits += $m[$k] ?? 0;
        }
        return [count($m), $checksum, $hits];
    }

    public static function emit($r): array
    {
        return $r;
    }
}
