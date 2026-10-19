<?php
final class Problem
{
    private static int $n = 10000000;

    public static function setup(array $args): void
    {
        if (count($args) > 0) {
            self::$n = (int) $args[0];
        }
    }

    public static function decode(string $data)
    {
        return null;
    }

    public static function solve($_)
    {
        $n = self::$n;
        // a byte string is PHP's compact byte array: "\1" = prime candidate, "\0" = composite
        $s = str_repeat("\1", $n + 1);
        $s[0] = "\0";
        $s[1] = "\0";
        for ($p = 2; $p * $p <= $n; $p++) {
            if ($s[$p] === "\1") {
                for ($m = $p * $p; $m <= $n; $m += $p) {
                    $s[$m] = "\0";
                }
            }
        }
        $count = 0;
        $last = 0;
        $sum = 0;
        for ($i = 2; $i <= $n; $i++) {
            if ($s[$i] === "\1") {
                $count++;
                $last = $i;
                $sum += $i;
            }
        }
        return [$count, $last, $sum];
    }

    public static function emit($r): array
    {
        return $r;
    }
}
