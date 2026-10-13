<?php
$n = (int) $argv[1];
$x = 1;
$m = [];

for ($i = 0; $i < $n; $i++) {
    $x = $x * 48271 % 2147483647;
    $k = $x % intdiv($n, 2);
    $m[$k] = ($m[$k] ?? 0) + 1;
}

$checksum = 0;
foreach ($m as $k => $c) {
    $checksum += $k * $c;
}

$hits = 0;
for ($i = 0; $i < $n; $i++) {
    $x = $x * 48271 % 2147483647;
    $hits += $m[$x % $n] ?? 0;
}

echo "distinct=" . count($m) . "\n";
echo "checksum=$checksum\n";
echo "hits=$hits\n";
