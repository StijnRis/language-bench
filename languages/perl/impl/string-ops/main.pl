package Problem;
use strict;
use warnings;
use utf8;

sub setup { }
sub decode { my ($data) = @_; utf8::decode($data); return $data; }   # a character string
sub solve {
    my ($text) = @_;
    my $codepoints = length $text;
    (my $encoded = $text) =~ tr/ /_/;
    utf8::encode($encoded);
    my $bytes = length $encoded;
    my $checksum = unpack("%32C*", $encoded);
    my $needle = 0;
    my $pos = index($text, "er");
    while ($pos != -1) { $needle++; $pos = index($text, "er", $pos + 2); }
    my $nwords = 1 + ($text =~ tr/ //);
    return [$bytes, $codepoints, $nwords, $needle, $checksum];
}
sub emit { my ($r) = @_; return $r; }
1;
