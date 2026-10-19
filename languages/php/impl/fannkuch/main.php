<?php
final class Problem
{
    private static int $n = 9;

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
        $perm1 = range(0, $n - 1);
        $count = array_fill(0, $n, 0);
        $maxflips = 0;
        $permcount = 0;
        $checksum = 0;
        $r = $n;
        while (true) {
            while ($r !== 1) {
                $count[$r - 1] = $r;
                $r--;
            }
            $perm = $perm1;
            $flips = 0;
            while (($k = $perm[0]) !== 0) {
                for ($i = 0, $j = $k; $i < $j; $i++, $j--) {
                    $t = $perm[$i];
                    $perm[$i] = $perm[$j];
                    $perm[$j] = $t;
                }
                $flips++;
            }
            if ($flips > $maxflips) {
                $maxflips = $flips;
            }
            $checksum += $permcount % 2 === 0 ? $flips : -$flips;
            while (true) {
                if ($r === $n) {
                    return [$checksum, $maxflips];
                }
                $p0 = $perm1[0];
                for ($i = 0; $i < $r; $i++) {
                    $perm1[$i] = $perm1[$i + 1];
                }
                $perm1[$r] = $p0;
                $count[$r]--;
                if ($count[$r] > 0) {
                    break;
                }
                $r++;
            }
            $permcount++;
        }
    }

    public static function emit($r): array
    {
        return $r;
    }
}
