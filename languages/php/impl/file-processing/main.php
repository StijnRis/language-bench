<?php
final class Problem
{
    public static function setup(array $args): void
    {
    }

    public static function decode(string $data)
    {
        return $data; // path of the file
    }

    public static function solve($path)
    {
        $f = fopen($path, "rb");
        $freq = [];
        $lines = 0;
        $total = 0;
        while (($line = fgets($f)) !== false) {
            [, $word, $value] = explode(",", $line);
            $total += (int) $value;
            $freq[$word] = ($freq[$word] ?? 0) + 1;
            $lines++;
        }
        fclose($f);
        $top = null;
        $topCount = -1;
        foreach ($freq as $w => $c) {
            $w = (string) $w;
            if ($c > $topCount || ($c === $topCount && strcmp($w, $top) < 0)) {
                $top = $w;
                $topCount = $c;
            }
        }
        return [$lines, $total, count($freq), $topCount, $top];
    }

    public static function emit($r): array
    {
        [$lines, $total, $distinct, $count, $word] = $r;
        return array_merge([$lines, $total, $distinct, $count, strlen($word)], array_values(unpack("C*", $word)));
    }
}
