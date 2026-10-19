# Binary trees, after the Computer Language Benchmarks Game.
package Problem;
use strict;
use warnings;
no warnings 'recursion';

my $depth_arg = 14;
sub setup { my ($args) = @_; $depth_arg = int($args->[0]) if @$args; }
sub decode { return undef; }

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
sub solve {
    my $min_depth = 4;
    my $max_depth = $min_depth + 2 > $depth_arg ? $min_depth + 2 : $depth_arg;
    my @out = (check_tree(make_tree($max_depth + 1)));
    my $long_lived = make_tree($max_depth);
    for (my $depth = $min_depth; $depth <= $max_depth; $depth += 2) {
        my $iterations = 1 << ($max_depth - $depth + $min_depth);
        my $check = 0;
        for (1 .. $iterations) { $check += check_tree(make_tree($depth)); }
        push @out, $iterations, $check;
    }
    push @out, check_tree($long_lived);
    return \@out;
}
sub emit { my ($r) = @_; return $r; }
1;
