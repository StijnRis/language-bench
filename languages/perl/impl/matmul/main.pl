package Problem;
use strict;
use warnings;

sub setup { }
sub decode {
    my ($data) = @_;
    my $n = unpack("l<", $data);
    my @vals = unpack("x4 d<*", $data);
    my (@a, @b);
    for my $i (0 .. $n - 1) {
        push @a, [@vals[$i * $n .. $i * $n + $n - 1]];
        push @b, [@vals[$n * $n + $i * $n .. $n * $n + $i * $n + $n - 1]];
    }
    return [$n, \@a, \@b];
}
sub solve {
    my ($inst) = @_;
    my ($n, $a, $b) = @$inst;
    my @c;
    for my $i (0 .. $n - 1) {
        my @ci = (0.0) x $n;
        my $ai = $a->[$i];
        for my $k (0 .. $n - 1) {
            my $aik = $ai->[$k];
            my $bk = $b->[$k];
            for my $j (0 .. $n - 1) {
                $ci[$j] += $aik * $bk->[$j];
            }
        }
        push @c, \@ci;
    }
    return \@c;
}
sub emit {
    my ($c) = @_;
    return [map { my $v = $_; map { int(floor_($_)) } @$v } @$c];
}
sub floor_ { my ($x) = @_; my $i = int($x); return $i > $x ? $i - 1 : $i; }
1;
