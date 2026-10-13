<?php
$f = fopen($argv[1], "rb");
$freq = [];
$lines = 0;
$total = 0;

while (($line = fgets($f)) !== false) {
    [, $word, $value] = explode(",", $line);
    $total += (int) $value;
    $freq[$word] = ($freq[$word] ?? 0) + 1;
    $lines++;
}
fclose($f);

$top = null;
$topCount = -1;
foreach ($freq as $w => $c) {
    $w = (string) $w;
    if ($c > $topCount || ($c === $topCount && strcmp($w, $top) < 0)) {
        $top = $w;
        $topCount = $c;
    }
}

echo "lines=$lines\n";
echo "sum=$total\n";
echo "distinct=" . count($freq) . "\n";
echo "top=$top $topCount\n";
