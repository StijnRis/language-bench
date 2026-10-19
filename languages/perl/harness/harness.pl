# language-bench harness for Perl: see harness/CONTRACT.md.
# usage: perl harness.pl <problem.pl> [problem arguments]
# The problem file defines package Problem with setup(\@args), decode($bytes), solve($instance),
# emit($result) -> array reference of integers (the canonical result words) and optionally release($instance, $result).
use strict;
use warnings;
use File::Spec;
use Time::HiRes qw(clock_gettime CLOCK_MONOTONIC CLOCK_REALTIME);

my ($problem_file, @problem_args) = @ARGV;
require File::Spec->rel2abs($problem_file);

sub num { my ($k, $d) = @_; my $v = $ENV{$k}; return (defined $v && $v ne "") ? $v + 0 : $d; }
sub mono { return int(clock_gettime(CLOCK_MONOTONIC) * 1e9 + 0.5); }
sub wall { return int(clock_gettime(CLOCK_REALTIME) * 1e9 + 0.5); }

sub read_full {
    my ($n) = @_;
    my $buf = "";
    while (length($buf) < $n) {
        my $got = read(STDIN, my $chunk, $n - length($buf));
        if (!$got) { print STDERR "harness: input ended early\n"; exit 1; }
        $buf .= $chunk;
    }
    return $buf;
}

my $input = $ENV{LB_INPUT} || "none";
my $budget = num("LB_BUDGET_SECONDS", 10) * 1e9;
my $min_iters = int(num("LB_MIN_ITERS", 3));
my $max_iters = int(num("LB_MAX_ITERS", 0));
my $start = int(num("LB_START", 0));
my $gen = $ENV{LB_GEN} || "/usr/local/bin/lbgen";
my $file = $ENV{LB_FILE} || "/dev/shm/lb-input";
my $pname = $ENV{LB_PROBLEM} || "";
my $file_ready = exists $ENV{LB_FILE_READY};
my ($P1, $P2) = (2147483647, 2147483629);

binmode STDIN;
Problem::setup(\@problem_args);
my @rows;
my $kernel = 0;
my $mono0 = mono();
my $wall0 = wall();
my $reason = "budget";

while (1) {
    my $data;
    if ($input eq "stream") {
        my $len = unpack("Q<", read_full(8));
        $data = $len ? read_full($len) : "";
    } elsif ($input eq "file") {
        if (!$file_ready) {
            system($gen, "file", $pname, $start + scalar(@rows), $file) == 0 or do { print STDERR "harness: generator failed\n"; exit 1; };
        }
        $data = $file;
    } else {
        $data = "";
    }
    my $inst = Problem::decode($data);
    undef $data;
    my $t0 = mono();
    my $res = Problem::solve($inst);
    my $t1 = mono();
    my ($h1, $h2) = (17, 19);
    my $words = Problem::emit($res);
    my $n = scalar @$words;
    for my $w (@$words) {
        $h1 = ($h1 * 1000003 + $w % $P1) % $P1;
        $h2 = ($h2 * 999983 + $w % $P2) % $P2;
    }
    $h1 = ($h1 * 1000003 + $n % $P1) % $P1;
    $h2 = ($h2 * 999983 + $n % $P2) % $P2;
    Problem->can("release") && Problem::release($inst, $res);
    undef $inst; undef $res; undef $words;
    unlink $file if $input eq "file" && !$file_ready && -e $file;
    push @rows, [$t0, $t1, $h1, $h2];
    $kernel += $t1 - $t0;
    if ($max_iters && @rows >= $max_iters) { $reason = "iters"; last; }
    last if $kernel >= $budget && @rows >= $min_iters;
}

my @out = ("LB 1 clock=Time::HiRes::clock_gettime(CLOCK_MONOTONIC)", "START mono=$mono0 wall=$wall0");
for my $i (0 .. $#rows) {
    my $r = $rows[$i];
    push @out, "ITER " . ($i + 1) . " t0=$r->[0] t1=$r->[1] check=$r->[2]:$r->[3]";
}
push @out, "DONE iters=" . scalar(@rows) . " kernel_ns=$kernel reason=$reason";
print join("\n", @out), "\n";
