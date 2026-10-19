package Problem;
use strict;
use warnings;

my $n_arg = 10000000;
sub setup { my ($args) = @_; $n_arg = int($args->[0]) if @$args; }
sub decode { return undef; }
sub solve {
    my $n = $n_arg;
    # a string used as a byte array is Perl's compact fast path for a sieve
    my $s = "\x01" x ($n + 1);
    substr($s, 0, 2) = "\x00\x00";
    for (my $p = 2; $p * $p <= $n; $p++) {
        next unless vec($s, $p, 8);
        for (my $m = $p * $p; $m <= $n; $m += $p) { vec($s, $m, 8) = 0; }
    }
    my ($count, $last, $sum) = (0, 0, 0);
    for my $i (2 .. $n) {
        if (vec($s, $i, 8)) { $count++; $last = $i; $sum += $i; }
    }
    return [$count, $last, $sum];
}
sub emit { my ($r) = @_; return $r; }
1;
