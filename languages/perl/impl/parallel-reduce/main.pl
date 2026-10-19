package Problem;
use strict;
use warnings;

# Perl threads are not part of every build, so workers are processes (like Python, Ruby and PHP here)
my ($n_arg, $workers_arg) = (2000000, 4);
sub setup { my ($args) = @_; ($n_arg, $workers_arg) = (int($args->[0]), int($args->[1])) if @$args > 1; }
sub decode { return undef; }

sub is_prime {
    my ($n) = @_;
    return 0 if $n < 2;
    return 1 if $n < 4;
    return 0 if $n % 2 == 0;
    for (my $d = 3; $d * $d <= $n; $d += 2) { return 0 if $n % $d == 0; }
    return 1;
}

sub solve {
    my ($n, $workers) = ($n_arg, $workers_arg);
    my @readers;
    for my $t (0 .. $workers - 1) {
        pipe(my $r, my $w) or die "pipe: $!";
        my $pid = fork() // die "fork: $!";
        if ($pid == 0) {
            close $r;
            my $count = 0;
            for (my $i = $t; $i < $n; $i += $workers) { $count++ if is_prime($i); }
            print {$w} "$count\n";
            close $w;
            POSIX::_exit(0);
        }
        close $w;
        push @readers, $r;
    }
    my $total = 0;
    for my $r (@readers) { $total += <$r>; close $r; }
    wait for 1 .. $workers;
    return [$total];
}
use POSIX ();
sub emit { my ($r) = @_; return $r; }
1;
