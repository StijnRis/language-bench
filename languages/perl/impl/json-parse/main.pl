use strict;
use warnings;
use B ();
use JSON::PP ();

open(my $fh, '<:raw', $ARGV[0]) or die "cannot open $ARGV[0]: $!";
my $text = do { local $/; <$fh> };
close $fh;

# JSON::PP is the JSON parser that ships with Perl (pure Perl; JSON::XS is not part of the core)
my $doc = JSON::PP->new->utf8->decode($text);

my ($objects, $int_sum, $str_len, $trues, $nulls) = (0, 0, 0, 0, 0);
my @stack = ($doc);
while (@stack) {
    my $v = pop @stack;
    my $t = ref $v;
    if ($t eq 'HASH') {
        $objects++;
        push @stack, values %$v;
    } elsif ($t eq 'ARRAY') {
        push @stack, @$v;
    } elsif (!defined $v) {
        $nulls++;
    } elsif ($t eq 'JSON::PP::Boolean') {
        $trues++ if $v;
    } else {
        # JSON::PP leaves numbers numeric and strings as strings; tell them apart by the SV flags
        my $flags = B::svref_2object(\$v)->FLAGS;
        if ($flags & (B::SVp_IOK() | B::SVp_NOK())) { $int_sum += $v }
        else { $str_len += length $v }
    }
}

print "objects=$objects\n";
print "int_sum=$int_sum\n";
print "string_length=$str_len\n";
print "true=$trues\n";
print "null=$nulls\n";
