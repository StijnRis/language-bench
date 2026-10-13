<?php
$n = (int) $argv[1];
$x = 1;
$a = [];
for ($i = 0; $i < $n; $i++) {
    $x = $x * 48271 % 2147483647;
    $a[] = $x;
}

sort($a);

$checksum = 0;
for ($i = 0; $i < $n; $i++) {
    $checksum = ($checksum + $i * $a[$i]) % 1000000007;
}

echo "first={$a[0]}\n";
echo "last={$a[$n - 1]}\n";
echo "median={$a[intdiv($n, 2)]}\n";
echo "checksum=$checksum\n";
