package Problem;
use strict;
use warnings;

sub setup { }
sub decode { my ($data) = @_; return [unpack("l<*", $data)]; }
sub solve { my ($values) = @_; return [sort { $a <=> $b } @$values]; }   # $a and $b are sort's own variables
sub emit { my ($sorted) = @_; return $sorted; }
1;
