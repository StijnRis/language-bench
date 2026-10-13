<?php
// Binary trees, after the Computer Language Benchmarks Game. A node is a two-element array.

function make_tree(int $d): array
{
    return $d === 0 ? [null, null] : [make_tree($d - 1), make_tree($d - 1)];
}

function check(array $t): int
{
    return $t[0] === null ? 1 : 1 + check($t[0]) + check($t[1]);
}

$n = (int) $argv[1];
$minDepth = 4;
$maxDepth = $n > $minDepth + 2 ? $n : $minDepth + 2;
$stretch = $maxDepth + 1;

echo "stretch tree of depth $stretch\t check: " . check(make_tree($stretch)) . "\n";
$longLived = make_tree($maxDepth);

for ($depth = $minDepth; $depth <= $maxDepth; $depth += 2) {
    $iterations = 1 << ($maxDepth - $depth + $minDepth);
    $sum = 0;
    for ($i = 0; $i < $iterations; $i++) {
        $sum += check(make_tree($depth));
    }
    echo "$iterations\t trees of depth $depth\t check: $sum\n";
}

echo "long lived tree of depth $maxDepth\t check: " . check($longLived) . "\n";
