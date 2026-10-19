package Problem;
use strict;
use warnings;

sub setup { }
sub decode { my ($data) = @_; return $data; }   # path of the file
sub solve {
    my ($path) = @_;
    open(my $fh, '<', $path) or die "cannot open $path: $!";
    my ($lines, $total) = (0, 0);
    my %freq;
    while (my $line = <$fh>) {
        chomp $line;
        my (undef, $word, $value) = split /,/, $line;
        $lines++;
        $total += $value;
        $freq{$word}++;
    }
    close $fh;
    my ($top, $top_count) = (undef, -1);
    for my $w (keys %freq) {
        my $c = $freq{$w};
        if ($c > $top_count || ($c == $top_count && $w lt $top)) { ($top, $top_count) = ($w, $c); }
    }
    return [$lines, $total, scalar(keys %freq), $top_count, $top];
}
sub emit {
    my ($r) = @_;
    my ($lines, $total, $distinct, $count, $word) = @$r;
    return [$lines, $total, $distinct, $count, length($word), unpack("C*", $word)];
}
1;
