<?php
$n = (int) $argv[1];
$perm1 = range(0, $n - 1);
$count = array_fill(0, $n, 0);
$maxflips = 0;
$permcount = 0;
$checksum = 0;
$r = $n;
while (true) {
    while ($r != 1) {
        $count[$r - 1] = $r;
        $r--;
    }
    $perm = $perm1;
    $flips = 0;
    while (($k = $perm[0]) != 0) {
        for ($i = 0, $j = $k; $i < $j; $i++, $j--) {
            $t = $perm[$i];
            $perm[$i] = $perm[$j];
            $perm[$j] = $t;
        }
        $flips++;
    }
    if ($flips > $maxflips) {
        $maxflips = $flips;
    }
    $checksum += ($permcount % 2 == 0) ? $flips : -$flips;
    while (true) {
        if ($r == $n) {
            echo "checksum=$checksum\n";
            echo "maxflips=$maxflips\n";
            exit(0);
        }
        $p0 = $perm1[0];
        for ($i = 0; $i < $r; $i++) {
            $perm1[$i] = $perm1[$i + 1];
        }
        $perm1[$r] = $p0;
        if (--$count[$r] > 0) {
            break;
        }
        $r++;
    }
    $permcount++;
}
