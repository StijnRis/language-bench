use strict;
use warnings;
use utf8;

my @vocab = (
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world",
);

my $n = $ARGV[0];
my $x = 1;
my @words;
for (1 .. $n) {
    $x = $x * 48271 % 2147483647;
    push @words, $vocab[$x % @vocab];
}
my $text = join " ", @words;   # a character string (use utf8)

my $codepoints = length $text;

(my $encoded = $text) =~ tr/ /_/;
utf8::encode($encoded);        # now bytes
my $bytes = length $encoded;
my $checksum = unpack("%32C*", $encoded);   # sum of the bytes

my $needle = 0;
my $pos = index($text, "er");
while ($pos != -1) {
    $needle++;
    $pos = index($text, "er", $pos + 2);
}

my $nwords = 1 + ($text =~ tr/ //);

print "bytes=$bytes\n";
print "codepoints=$codepoints\n";
print "words=$nwords\n";
print "needle=$needle\n";
print "checksum=$checksum\n";
