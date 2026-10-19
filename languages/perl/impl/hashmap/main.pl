use strict;
use warnings;

my $n = $ARGV[0];
my $x = 1;
my %m;
my $half = int($n / 2);
for (1 .. $n) {
    $x = $x * 48271 % 2147483647;
    $m{$x % $half}++;
}

my $checksum = 0;
while (my ($k, $c) = each %m) {
    $checksum += $k * $c;
}

my $hits = 0;
for (1 .. $n) {
    $x = $x * 48271 % 2147483647;
    $hits += $m{$x % $n} // 0;
}

print "distinct=", scalar(keys %m), "\n";
print "checksum=$checksum\n";
print "hits=$hits\n";
