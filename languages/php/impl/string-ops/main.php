<?php
final class Problem
{
    public static function setup(array $args): void
    {
    }

    public static function decode(string $data)
    {
        return $data; // PHP strings are byte strings: UTF-8 is handled by the mb_* functions
    }

    public static function solve($text)
    {
        $checksum = 0;
        foreach (count_chars(strtr($text, " ", "_"), 1) as $byte => $count) {
            $checksum += $byte * $count;
        }
        return [strlen($text), mb_strlen($text, "UTF-8"), substr_count($text, " ") + 1, substr_count($text, "er"), $checksum];
    }

    public static function emit($r): array
    {
        return $r;
    }
}
