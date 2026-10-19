<?php
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
        sort($a); // PHP's hybrid insertion sort / quicksort
        return $a;
    }

    public static function emit($a): array
    {
        return $a;
    }
}
