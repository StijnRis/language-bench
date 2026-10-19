<?php
// N-body simulation, after the Computer Language Benchmarks Game.
final class Problem
{
    private static int $steps = 1000000;

    public static function setup(array $args): void
    {
        if (count($args) > 0) {
            self::$steps = (int) $args[0];
        }
    }

    public static function decode(string $data)
    {
        $v = array_values(unpack("e35", $data));
        $b = [];
        for ($i = 0; $i < 5; $i++) {
            $b[] = array_slice($v, $i * 7, 7); // x y z vx vy vz mass
        }
        return $b;
    }

    private static function energy(array $b): float
    {
        $e = 0.0;
        for ($i = 0; $i < 5; $i++) {
            $bi = $b[$i];
            $e += 0.5 * $bi[6] * ($bi[3] * $bi[3] + $bi[4] * $bi[4] + $bi[5] * $bi[5]);
            for ($j = $i + 1; $j < 5; $j++) {
                $bj = $b[$j];
                $dx = $bi[0] - $bj[0];
                $dy = $bi[1] - $bj[1];
                $dz = $bi[2] - $bj[2];
                $e -= $bi[6] * $bj[6] / sqrt($dx * $dx + $dy * $dy + $dz * $dz);
            }
        }
        return $e;
    }

    public static function solve($b)
    {
        $solar = 4 * M_PI * M_PI;
        $px = $py = $pz = 0.0;
        foreach ($b as $o) {
            $px += $o[3] * $o[6];
            $py += $o[4] * $o[6];
            $pz += $o[5] * $o[6];
        }
        $b[0][3] = -$px / $solar;
        $b[0][4] = -$py / $solar;
        $b[0][5] = -$pz / $solar;
        $e0 = self::energy($b);
        $dt = 0.01;
        for ($s = 0; $s < self::$steps; $s++) {
            for ($i = 0; $i < 5; $i++) {
                for ($j = $i + 1; $j < 5; $j++) {
                    $dx = $b[$i][0] - $b[$j][0];
                    $dy = $b[$i][1] - $b[$j][1];
                    $dz = $b[$i][2] - $b[$j][2];
                    $d2 = $dx * $dx + $dy * $dy + $dz * $dz;
                    $mag = $dt / ($d2 * sqrt($d2));
                    $bm = $b[$i][6] * $mag;
                    $cm = $b[$j][6] * $mag;
                    $b[$i][3] -= $dx * $cm;
                    $b[$i][4] -= $dy * $cm;
                    $b[$i][5] -= $dz * $cm;
                    $b[$j][3] += $dx * $bm;
                    $b[$j][4] += $dy * $bm;
                    $b[$j][5] += $dz * $bm;
                }
            }
            for ($i = 0; $i < 5; $i++) {
                $b[$i][0] += $dt * $b[$i][3];
                $b[$i][1] += $dt * $b[$i][4];
                $b[$i][2] += $dt * $b[$i][5];
            }
        }
        return [$e0, self::energy($b)];
    }

    public static function emit($r): array
    {
        return array_map(function ($e) { return (int) floor($e * 1e9 + 0.5); }, $r);
    }
}
