<?php
$vocab = [
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world",
];

$n = (int) $argv[1];
$x = 1;
$words = [];
for ($i = 0; $i < $n; $i++) {
    $x = $x * 48271 % 2147483647;
    $words[] = $vocab[$x % 20];
}
$text = implode(" ", $words);

$checksum = 0;
foreach (count_chars(strtr($text, " ", "_"), 1) as $byte => $count) {
    $checksum += $byte * $count;
}

echo "bytes=" . strlen($text) . "\n";
echo "codepoints=" . mb_strlen($text, "UTF-8") . "\n";
echo "words=" . count(explode(" ", $text)) . "\n";
echo "needle=" . substr_count($text, "er") . "\n";
echo "checksum=$checksum\n";
