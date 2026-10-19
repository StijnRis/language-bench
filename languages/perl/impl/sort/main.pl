use strict;
use warnings;

my $n = $ARGV[0];
my $x = 1;
my @a;
$#a = $n - 1;
for my $i (0 .. $n - 1) {
    $x = $x * 48271 % 2147483647;
    $a[$i] = $x;
}

@a = sort { $a <=> $b } @a;

my $checksum = 0;
for my $i (0 .. $n - 1) {
    $checksum = ($checksum + $i * $a[$i]) % 1000000007;
}

print "first=$a[0]\n";
print "last=$a[-1]\n";
print "median=$a[int($n / 2)]\n";
print "checksum=$checksum\n";
