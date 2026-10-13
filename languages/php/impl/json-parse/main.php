<?php
$doc = json_decode(file_get_contents($argv[1]));

$objects = $intSum = $strLen = $trues = $nulls = 0;
$stack = [$doc];
while ($stack) {
    $v = array_pop($stack);
    if (is_object($v)) {
        $objects++;
        foreach ($v as $x) {
            $stack[] = $x;
        }
    } elseif (is_array($v)) {
        foreach ($v as $x) {
            $stack[] = $x;
        }
    } elseif (is_string($v)) {
        $strLen += strlen($v);
    } elseif ($v === true) {
        $trues++;
    } elseif ($v === null) {
        $nulls++;
    } elseif (is_int($v)) {
        $intSum += $v;
    }
}

echo "objects=$objects\n";
echo "int_sum=$intSum\n";
echo "string_length=$strLen\n";
echo "true=$trues\n";
echo "null=$nulls\n";
