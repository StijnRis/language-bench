<?php
// Binary trees, after the Computer Language Benchmarks Game.
final class Problem
{
    private static int $depth = 14;

    public static function setup(array $args): void
    {
        if (count($args) > 0) {
            self::$depth = (int) $args[0];
        }
    }

    public static function decode(string $data)
    {
        return null;
    }

    private static function makeTree(int $d): array
    {
        if ($d === 0) {
            return [null, null];
        }
        $d--;
        return [self::makeTree($d), self::makeTree($d)];
    }

    private static function checkTree(array $node): int
    {
        if ($node[0] === null) {
            return 1;
        }
        return 1 + self::checkTree($node[0]) + self::checkTree($node[1]);
    }

    public static function solve($_)
    {
        $minDepth = 4;
        $maxDepth = max($minDepth + 2, self::$depth);
        $out = [self::checkTree(self::makeTree($maxDepth + 1))];
        $longLived = self::makeTree($maxDepth);
        for ($depth = $minDepth; $depth <= $maxDepth; $depth += 2) {
            $iterations = 1 << ($maxDepth - $depth + $minDepth);
            $check = 0;
            for ($i = 0; $i < $iterations; $i++) {
                $check += self::checkTree(self::makeTree($depth));
            }
            $out[] = $iterations;
            $out[] = $check;
        }
        $out[] = self::checkTree($longLived);
        return $out;
    }

    public static function emit($r): array
    {
        return $r;
    }
}
