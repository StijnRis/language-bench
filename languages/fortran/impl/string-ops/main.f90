! Character variables hold the UTF-8 bytes of the source literals; code points are the bytes that are not continuation bytes.
program string_ops
  implicit none
  character(len=32) :: arg
  character(len=:), allocatable :: text
  character(len=12), parameter :: vocab(20) = [character(len=12) :: &
    'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'naïve', 'café', &
    'über', 'résumé', 'привет', 'мир', 'код', '日本語', '世界', '速度', 'hello', 'world']
  integer(8) :: n, i, x, total, p, bytes, codepoints, spaces, needle, checksum
  integer :: w, c, l

  call get_command_argument(1, arg)
  read(arg, *) n
  total = n - 1
  x = 1
  do i = 1, n
    x = mod(x * 48271_8, 2147483647_8)
    total = total + len_trim(vocab(int(mod(x, 20_8)) + 1))
  end do
  allocate(character(len=total) :: text)
  x = 1
  p = 1
  do i = 1, n
    x = mod(x * 48271_8, 2147483647_8)
    w = int(mod(x, 20_8)) + 1
    l = len_trim(vocab(w))
    if (i > 1) then
      text(p:p) = ' '
      p = p + 1
    end if
    text(p:p + l - 1) = vocab(w)(1:l)
    p = p + l
  end do

  bytes = total
  codepoints = 0; spaces = 0; checksum = 0; needle = 0
  i = 1
  do while (i <= total)
    c = iand(iachar(text(i:i)), 255)
    if (iand(c, 192) /= 128) codepoints = codepoints + 1
    if (c == 32) then
      spaces = spaces + 1
      checksum = checksum + 95
    else
      checksum = checksum + c
    end if
    if (c == 101 .and. i < total) then
      if (text(i + 1:i + 1) == 'r') then
        needle = needle + 1
        ! the 'r' is consumed by the match: add its byte to the checksum and skip it
        checksum = checksum + 114
        codepoints = codepoints + 1
        i = i + 1
      end if
    end if
    i = i + 1
  end do

  write(*, '(a,i0)') 'bytes=', bytes
  write(*, '(a,i0)') 'codepoints=', codepoints
  write(*, '(a,i0)') 'words=', spaces + 1
  write(*, '(a,i0)') 'needle=', needle
  write(*, '(a,i0)') 'checksum=', checksum
end program
