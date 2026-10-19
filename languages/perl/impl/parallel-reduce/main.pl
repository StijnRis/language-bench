use strict;
use warnings;

sub is_prime {
    my ($n) = @_;
    return 0 if $n < 2;
    return 1 if $n < 4;
    return 0 if $n % 2 == 0;
    for (my $d = 3; $d * $d <= $n; $d += 2) {
        return 0 if $n % $d == 0;
    }
    return 1;
}

my ($n, $workers) = @ARGV;

# Perl threads are not part of every build, so workers are processes (like Python, Ruby and PHP here)
my @readers;
for my $t (0 .. $workers - 1) {
    pipe(my $r, my $w) or die "pipe: $!";
    my $pid = fork() // die "fork: $!";
    if ($pid == 0) {
        close $r;
        my $count = 0;
        for (my $i = $t; $i < $n; $i += $workers) {
            $count++ if is_prime($i);
        }
        print {$w} "$count\n";
        close $w;
        exit 0;
    }
    close $w;
    push @readers, $r;
}

my $total = 0;
for my $r (@readers) {
    $total += <$r>;
    close $r;
}
wait for 1 .. $workers;
print "primes=$total\n";
