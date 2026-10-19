package Problem;
use strict;
use warnings;

sub setup { }
sub decode {
    my ($data) = @_;
    my @a = unpack("l<*", $data);
    my $n = @a / 2;
    return [[@a[0 .. $n - 1]], [@a[$n .. $#a]]];
}
sub solve {
    my ($inst) = @_;
    my ($keys, $lookups) = @$inst;
    my %m;
    $m{$_}++ for @$keys;
    my $checksum = 0;
    while (my ($k, $c) = each %m) { $checksum += $k * $c; }
    my $hits = 0;
    $hits += $m{$_} // 0 for @$lookups;
    return [scalar(keys %m), $checksum, $hits];
}
sub emit { my ($r) = @_; return $r; }
1;
