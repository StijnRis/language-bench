# conformance problem: sum, maximum and a checksum of 4096 int32 values
package Problem;
use strict;
use warnings;

sub setup { }
sub decode { my ($data) = @_; return [unpack("l<*", $data)]; }
sub solve {
    my ($a) = @_;
    my ($sum, $mx, $sq) = (0, 0, 0);
    for my $v (@$a) { $sum += $v; $mx = $v if $v > $mx; $sq = ($sq + $v * $v) % 1000003; }
    return [$sum, $mx, $sq, scalar @$a];
}
sub emit { my ($r) = @_; return $r; }
1;
