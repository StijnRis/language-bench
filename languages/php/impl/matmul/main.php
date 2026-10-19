<?php
final class Problem
{
    public static function setup(array $args): void
    {
    }

    public static function decode(string $data)
    {
        $n = unpack("l", substr($data, 0, 4))[1];
        $vals = array_values(unpack("e*", substr($data, 4)));
        return [$n, array_chunk(array_slice($vals, 0, $n * $n), $n), array_chunk(array_slice($vals, $n * $n), $n)];
    }

    public static function solve($inst)
    {
        [$n, $a, $b] = $inst;
        $c = [];
        for ($i = 0; $i < $n; $i++) {
            $ci = array_fill(0, $n, 0.0);
            $ai = $a[$i];
            for ($k = 0; $k < $n; $k++) {
                $aik = $ai[$k];
                $bk = $b[$k];
                for ($j = 0; $j < $n; $j++) {
                    $ci[$j] += $aik * $bk[$j];
                }
            }
            $c[] = $ci;
        }
        return $c;
    }

    public static function emit($c): array
    {
        $out = [];
        foreach ($c as $row) {
            foreach ($row as $v) {
                $out[] = (int) floor($v + 0.5);
            }
        }
        return $out;
    }
}
