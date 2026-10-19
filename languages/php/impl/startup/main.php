<?php
// start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
final class Problem
{
    public static function setup(array $args): void
    {
    }

    public static function decode(string $data)
    {
        return null;
    }

    public static function solve($_)
    {
        return null;
    }

    public static function emit($r): array
    {
        return [1];
    }
}
