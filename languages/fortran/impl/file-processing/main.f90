! Fortran has no hash map in its standard library: a small open-addressing table keyed by the word.
program file_processing
  implicit none
  integer, parameter :: slots = 32768, wlen = 32
  character(len=256) :: path
  character(len=:), allocatable :: buf
  integer(8) :: pos, eol, fsize
  character(len=wlen) :: keys(0:slots - 1), word, top
  integer :: counts(0:slots - 1)
  integer :: u, ios, i, h, distinct, topcount
  integer(8) :: c1, c2
  integer(8) :: lines, total, v

  call get_command_argument(1, path)
  keys = ''
  counts = 0
  distinct = 0
  lines = 0
  total = 0
  open(newunit=u, file=trim(path), access='stream', form='unformatted', status='old', action='read', iostat=ios)
  if (ios /= 0) stop 'cannot open input'
  inquire(unit=u, size=fsize)
  allocate(character(len=fsize) :: buf)
  read(u) buf
  pos = 1
  do while (pos <= fsize)
    eol = pos
    do while (eol <= fsize)
      if (buf(eol:eol) == achar(10)) exit
      eol = eol + 1
    end do
    ! the line is buf(pos:eol-1)
    c1 = pos
    do while (buf(c1:c1) /= ',')
      c1 = c1 + 1
    end do
    c2 = c1 + 1
    do while (buf(c2:c2) /= ',')
      c2 = c2 + 1
    end do
    word = buf(c1 + 1:c2 - 1)
    v = 0
    do i = c2 + 1, eol - 1
      v = v * 10 + (iachar(buf(i:i)) - 48)
    end do
    total = total + v
    lines = lines + 1
    h = 5381
    do i = c1 + 1, c2 - 1
      h = iand(h * 33 + iachar(buf(i:i)), 16777215)
    end do
    h = iand(h, slots - 1)
    do
      if (counts(h) == 0) then
        keys(h) = word
        counts(h) = 1
        distinct = distinct + 1
        exit
      else if (keys(h) == word) then
        counts(h) = counts(h) + 1
        exit
      end if
      h = iand(h + 1, slots - 1)
    end do
    pos = eol + 1
  end do
  close(u)

  topcount = -1
  top = ''
  do h = 0, slots - 1
    if (counts(h) == 0) cycle
    if (counts(h) > topcount .or. (counts(h) == topcount .and. llt(keys(h), top))) then
      topcount = counts(h)
      top = keys(h)
    end if
  end do

  write(*, '(a,i0)') 'lines=', lines
  write(*, '(a,i0)') 'sum=', total
  write(*, '(a,i0)') 'distinct=', distinct
  write(*, '(a,a,a,i0)') 'top=', trim(top), ' ', topcount
end program
