use strict;
use warnings;

my $n = $ARGV[0];
my (@a, @b, @c);
for my $i (0 .. $n - 1) {
    $a[$i] = [map { ($i * 31 + $_ * 17) % 10 + 1.0 } 0 .. $n - 1];
    $b[$i] = [map { ($i * 13 + $_ * 7) % 10 - 4.0 } 0 .. $n - 1];
    $c[$i] = [(0.0) x $n];
}

for my $i (0 .. $n - 1) {
    my $ci = $c[$i];
    my $ai = $a[$i];
    for my $k (0 .. $n - 1) {
        my $aik = $ai->[$k];
        my $bk = $b[$k];
        for my $j (0 .. $n - 1) {
            $ci->[$j] += $aik * $bk->[$j];
        }
    }
}

my ($trace, $total) = (0.0, 0.0);
for my $i (0 .. $n - 1) {
    $trace += $c[$i][$i];
    $total += $_ for @{ $c[$i] };
}
printf "trace=%d\n", $trace;
printf "sum=%d\n", $total;
printf "c00=%d\n", $c[0][0];
printf "clast=%d\n", $c[$n - 1][$n - 1];
