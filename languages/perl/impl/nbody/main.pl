# N-body simulation, after the Computer Language Benchmarks Game.
package Problem;
use strict;
use warnings;

my $steps = 1000000;
sub setup { my ($args) = @_; $steps = int($args->[0]) if @$args; }
sub decode {
    my ($data) = @_;
    my @v = unpack("d<35", $data);
    return [map { [@v[$_ * 7 .. $_ * 7 + 6]] } 0 .. 4];   # x y z vx vy vz mass
}
sub energy {
    my ($b) = @_;
    my $e = 0.0;
    for my $i (0 .. 4) {
        my $bi = $b->[$i];
        $e += 0.5 * $bi->[6] * ($bi->[3] * $bi->[3] + $bi->[4] * $bi->[4] + $bi->[5] * $bi->[5]);
        for my $j ($i + 1 .. 4) {
            my $bj = $b->[$j];
            my ($dx, $dy, $dz) = ($bi->[0] - $bj->[0], $bi->[1] - $bj->[1], $bi->[2] - $bj->[2]);
            $e -= $bi->[6] * $bj->[6] / sqrt($dx * $dx + $dy * $dy + $dz * $dz);
        }
    }
    return $e;
}
sub solve {
    my ($b) = @_;
    my $solar = 4 * 3.141592653589793 * 3.141592653589793;
    my ($px, $py, $pz) = (0.0, 0.0, 0.0);
    for my $o (@$b) { $px += $o->[3] * $o->[6]; $py += $o->[4] * $o->[6]; $pz += $o->[5] * $o->[6]; }
    $b->[0][3] = -$px / $solar; $b->[0][4] = -$py / $solar; $b->[0][5] = -$pz / $solar;
    my $e0 = energy($b);
    my $dt = 0.01;
    for (1 .. $steps) {
        for my $i (0 .. 3) {
            my $bi = $b->[$i];
            for my $j ($i + 1 .. 4) {
                my $bj = $b->[$j];
                my $dx = $bi->[0] - $bj->[0];
                my $dy = $bi->[1] - $bj->[1];
                my $dz = $bi->[2] - $bj->[2];
                my $d2 = $dx * $dx + $dy * $dy + $dz * $dz;
                my $mag = $dt / ($d2 * sqrt($d2));
                my $bm = $bi->[6] * $mag;
                my $cm = $bj->[6] * $mag;
                $bi->[3] -= $dx * $cm; $bi->[4] -= $dy * $cm; $bi->[5] -= $dz * $cm;
                $bj->[3] += $dx * $bm; $bj->[4] += $dy * $bm; $bj->[5] += $dz * $bm;
            }
        }
        for my $o (@$b) {
            $o->[0] += $dt * $o->[3];
            $o->[1] += $dt * $o->[4];
            $o->[2] += $dt * $o->[5];
        }
    }
    return [$e0, energy($b)];
}
sub emit {
    my ($r) = @_;
    return [map { my $x = $_ * 1e9 + 0.5; my $i = int($x); $i > $x ? $i - 1 : $i } @$r];
}
1;
