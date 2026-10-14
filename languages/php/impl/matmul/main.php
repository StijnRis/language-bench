<?php
$n = (int) $argv[1];
$a = [];
$b = [];
$c = [];
for ($i = 0; $i < $n; $i++) {
    $ra = [];
    $rb = [];
    for ($j = 0; $j < $n; $j++) {
        $ra[] = (float) (($i * 31 + $j * 17) % 10 + 1);
        $rb[] = (float) (($i * 13 + $j * 7) % 10 - 4);
    }
    $a[] = $ra;
    $b[] = $rb;
    $c[] = array_fill(0, $n, 0.0);
}

for ($i = 0; $i < $n; $i++) {
    $ci = $c[$i];
    for ($k = 0; $k < $n; $k++) {
        $aik = $a[$i][$k];
        $bk = $b[$k];
        for ($j = 0; $j < $n; $j++) {
            $ci[$j] += $aik * $bk[$j];
        }
    }
    $c[$i] = $ci;
}

$trace = 0.0;
$sum = 0.0;
for ($i = 0; $i < $n; $i++) {
    $trace += $c[$i][$i];
    for ($j = 0; $j < $n; $j++) {
        $sum += $c[$i][$j];
    }
}
echo "trace=" . (int) $trace . "\n";
echo "sum=" . (int) $sum . "\n";
echo "c00=" . (int) $c[0][0] . "\n";
echo "clast=" . (int) $c[$n - 1][$n - 1] . "\n";
