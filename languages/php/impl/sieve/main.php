<?php
$n = (int) $argv[1];
// a byte string is PHP's compact byte array: "\1" = prime candidate, "\0" = composite
$s = str_repeat("\1", $n + 1);
$s[0] = "\0";
$s[1] = "\0";
for ($p = 2; $p * $p <= $n; $p++) {
    if ($s[$p] === "\1") {
        for ($m = $p * $p; $m <= $n; $m += $p) {
            $s[$m] = "\0";
        }
    }
}
$count = 0;
$last = 0;
$sum = 0;
for ($i = 2; $i <= $n; $i++) {
    if ($s[$i] === "\1") {
        $count++;
        $last = $i;
        $sum += $i;
    }
}
echo "count=$count\n";
echo "last=$last\n";
echo "sum=$sum\n";
