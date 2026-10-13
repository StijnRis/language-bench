<?php
// N-body simulation, after the Computer Language Benchmarks Game.

const PI = 3.141592653589793;
const SOLAR_MASS = 4 * PI * PI;
const DAYS = 365.24;

// each body: [x, y, z, vx, vy, vz, mass]
$bodies = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, SOLAR_MASS],
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
];

function offset_momentum(array &$bodies): void
{
    $px = $py = $pz = 0.0;
    foreach ($bodies as $b) {
        $px += $b[3] * $b[6];
        $py += $b[4] * $b[6];
        $pz += $b[5] * $b[6];
    }
    $bodies[0][3] = -$px / SOLAR_MASS;
    $bodies[0][4] = -$py / SOLAR_MASS;
    $bodies[0][5] = -$pz / SOLAR_MASS;
}

function energy(array $bodies): float
{
    $e = 0.0;
    for ($i = 0; $i < 5; $i++) {
        $b = $bodies[$i];
        $e += 0.5 * $b[6] * ($b[3] * $b[3] + $b[4] * $b[4] + $b[5] * $b[5]);
        for ($j = $i + 1; $j < 5; $j++) {
            $b2 = $bodies[$j];
            $dx = $b[0] - $b2[0];
            $dy = $b[1] - $b2[1];
            $dz = $b[2] - $b2[2];
            $e -= ($b[6] * $b2[6]) / sqrt($dx * $dx + $dy * $dy + $dz * $dz);
        }
    }
    return $e;
}

function advance(array &$bodies, float $dt): void
{
    for ($i = 0; $i < 5; $i++) {
        for ($j = $i + 1; $j < 5; $j++) {
            $dx = $bodies[$i][0] - $bodies[$j][0];
            $dy = $bodies[$i][1] - $bodies[$j][1];
            $dz = $bodies[$i][2] - $bodies[$j][2];
            $d2 = $dx * $dx + $dy * $dy + $dz * $dz;
            $mag = $dt / ($d2 * sqrt($d2));
            $mi = $bodies[$i][6];
            $mj = $bodies[$j][6];
            $bodies[$i][3] -= $dx * $mj * $mag;
            $bodies[$i][4] -= $dy * $mj * $mag;
            $bodies[$i][5] -= $dz * $mj * $mag;
            $bodies[$j][3] += $dx * $mi * $mag;
            $bodies[$j][4] += $dy * $mi * $mag;
            $bodies[$j][5] += $dz * $mi * $mag;
        }
    }
    for ($i = 0; $i < 5; $i++) {
        $bodies[$i][0] += $dt * $bodies[$i][3];
        $bodies[$i][1] += $dt * $bodies[$i][4];
        $bodies[$i][2] += $dt * $bodies[$i][5];
    }
}

$n = (int) $argv[1];
offset_momentum($bodies);
printf("%.9f\n", energy($bodies));
for ($i = 0; $i < $n; $i++) {
    advance($bodies, 0.01);
}
printf("%.9f\n", energy($bodies));
