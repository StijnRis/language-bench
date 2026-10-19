use strict;
use warnings;

my $n = $ARGV[0];
my @perm1 = (0 .. $n - 1);
my @count = (0) x $n;
my ($maxflips, $permcount, $checksum) = (0, 0, 0);
my $r = $n;
while (1) {
    while ($r != 1) {
        $count[$r - 1] = $r;
        $r--;
    }
    my @perm = @perm1;
    my $flips = 0;
    my $k = $perm[0];
    while ($k) {
        @perm[0 .. $k] = reverse @perm[0 .. $k];
        $flips++;
        $k = $perm[0];
    }
    $maxflips = $flips if $flips > $maxflips;
    $checksum += $permcount % 2 == 0 ? $flips : -$flips;
    while (1) {
        if ($r == $n) {
            print "checksum=$checksum\n";
            print "maxflips=$maxflips\n";
            exit 0;
        }
        my $p0 = $perm1[0];
        for my $i (0 .. $r - 1) {
            $perm1[$i] = $perm1[$i + 1];
        }
        $perm1[$r] = $p0;
        $count[$r]--;
        last if $count[$r] > 0;
        $r++;
    }
    $permcount++;
}
