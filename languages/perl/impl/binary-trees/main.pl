# Binary trees, after the Computer Language Benchmarks Game.
use strict;
use warnings;
no warnings 'recursion';

sub make_tree {
    my ($d) = @_;
    return [undef, undef] if $d == 0;
    $d--;
    return [make_tree($d), make_tree($d)];
}

sub check_tree {
    my ($node) = @_;
    return 1 unless defined $node->[0];
    return 1 + check_tree($node->[0]) + check_tree($node->[1]);
}

my $n = $ARGV[0];
my $min_depth = 4;
my $max_depth = $min_depth + 2 > $n ? $min_depth + 2 : $n;
my $stretch_depth = $max_depth + 1;

print "stretch tree of depth $stretch_depth\t check: ", check_tree(make_tree($stretch_depth)), "\n";
my $long_lived = make_tree($max_depth);

for (my $depth = $min_depth; $depth <= $max_depth; $depth += 2) {
    my $iterations = 1 << ($max_depth - $depth + $min_depth);
    my $check = 0;
    for (1 .. $iterations) {
        $check += check_tree(make_tree($depth));
    }
    print "$iterations\t trees of depth $depth\t check: $check\n";
}

print "long lived tree of depth $max_depth\t check: ", check_tree($long_lived), "\n";
