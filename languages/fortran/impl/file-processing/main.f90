! Fortran has no hash map in its standard library: a small open-addressing table keyed by the word.
module problem
  use lb_hash
  implicit none
  integer, parameter :: slots = 32768, wlen = 32
  character(len=512) :: path
  character(len=wlen) :: keys(0:slots - 1), top
  integer :: counts(0:slots - 1)
  integer :: distinct, topcount
  integer(8) :: lines, total
contains
  subroutine lb_setup()
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
    path = data
  end subroutine

  subroutine lb_solve()
    character(len=:), allocatable :: buf
    character(len=wlen) :: word
    integer(8) :: pos, eol, fsize, c1, c2, v
    integer :: u, ios, i, h
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
    close(u)
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
      do i = int(c2) + 1, int(eol) - 1
        v = v * 10 + (iachar(buf(i:i)) - 48)
      end do
      total = total + v
      lines = lines + 1
      h = 5381
      do i = int(c1) + 1, int(c2) - 1
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
    topcount = -1
    top = ''
    do h = 0, slots - 1
      if (counts(h) == 0) cycle
      if (counts(h) > topcount .or. (counts(h) == topcount .and. llt(keys(h), top))) then
        topcount = counts(h)
        top = keys(h)
      end if
    end do
  end subroutine

  subroutine lb_emit()
    integer :: i
    call lb_sink(lines); call lb_sink(total); call lb_sink(int(distinct, 8)); call lb_sink(int(topcount, 8))
    call lb_sink(int(len_trim(top), 8))
    do i = 1, len_trim(top)
      call lb_sink(int(iachar(top(i:i)), 8))
    end do
  end subroutine

  subroutine lb_release()
  end subroutine
end module
