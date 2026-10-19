use strict;
use warnings;

open(my $fh, '<', $ARGV[0]) or die "cannot open $ARGV[0]: $!";
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
    if ($c > $top_count || ($c == $top_count && $w lt $top)) {
        ($top, $top_count) = ($w, $c);
    }
}

print "lines=$lines\n";
print "sum=$total\n";
print "distinct=", scalar(keys %freq), "\n";
print "top=$top $top_count\n";
