# N-body simulation, after the Computer Language Benchmarks Game.
use strict;
use warnings;

use constant PI         => 3.141592653589793;
use constant SOLAR_MASS => 4 * PI * PI;
use constant DAYS       => 365.24;

# each body: [x, y, z, vx, vy, vz, mass]
my @bodies = (
    [0, 0, 0, 0, 0, 0, SOLAR_MASS],
    [4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
     1.66007664274403694e-03 * DAYS, 7.69901118419740425e-03 * DAYS, -6.90460016972063023e-05 * DAYS,
     9.54791938424326609e-04 * SOLAR_MASS],
    [8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
     -2.76742510726862411e-03 * DAYS, 4.99852801234917238e-03 * DAYS, 2.30417297573763929e-05 * DAYS,
     2.85885980666130812e-04 * SOLAR_MASS],
    [1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
     2.96460137564761618e-03 * DAYS, 2.37847173959480950e-03 * DAYS, -2.96589568540237556e-05 * DAYS,
     4.36624404335156298e-05 * SOLAR_MASS],
    [1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
     2.68067772490389322e-03 * DAYS, 1.62824170038242295e-03 * DAYS, -9.51592254519715870e-05 * DAYS,
     5.15138902046611451e-05 * SOLAR_MASS],
);
my $nb = @bodies;

sub energy {
    my $e = 0.0;
    for my $i (0 .. $nb - 1) {
        my $b = $bodies[$i];
        $e += 0.5 * $b->[6] * ($b->[3] ** 2 + $b->[4] ** 2 + $b->[5] ** 2);
        for my $j ($i + 1 .. $nb - 1) {
            my $c = $bodies[$j];
            my ($dx, $dy, $dz) = ($b->[0] - $c->[0], $b->[1] - $c->[1], $b->[2] - $c->[2]);
            $e -= $b->[6] * $c->[6] / sqrt($dx * $dx + $dy * $dy + $dz * $dz);
        }
    }
    return $e;
}

sub advance {
    my ($dt) = @_;
    for my $i (0 .. $nb - 1) {
        my $b = $bodies[$i];
        for my $j ($i + 1 .. $nb - 1) {
            my $c = $bodies[$j];
            my $dx = $b->[0] - $c->[0];
            my $dy = $b->[1] - $c->[1];
            my $dz = $b->[2] - $c->[2];
            my $d2 = $dx * $dx + $dy * $dy + $dz * $dz;
            my $mag = $dt / ($d2 * sqrt($d2));
            my $bm = $b->[6] * $mag;
            my $cm = $c->[6] * $mag;
            $b->[3] -= $dx * $cm; $b->[4] -= $dy * $cm; $b->[5] -= $dz * $cm;
            $c->[3] += $dx * $bm; $c->[4] += $dy * $bm; $c->[5] += $dz * $bm;
        }
    }
    for my $b (@bodies) {
        $b->[0] += $dt * $b->[3];
        $b->[1] += $dt * $b->[4];
        $b->[2] += $dt * $b->[5];
    }
}

my ($px, $py, $pz) = (0.0, 0.0, 0.0);
for my $b (@bodies) {
    $px += $b->[3] * $b->[6];
    $py += $b->[4] * $b->[6];
    $pz += $b->[5] * $b->[6];
}
$bodies[0][3] = -$px / SOLAR_MASS;
$bodies[0][4] = -$py / SOLAR_MASS;
$bodies[0][5] = -$pz / SOLAR_MASS;

printf "%.9f\n", energy();
advance(0.01) for 1 .. $ARGV[0];
printf "%.9f\n", energy();
