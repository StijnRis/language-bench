! Fortran has no JSON library: a recursive-descent parser that tallies the statistics while it parses
! (it does not build a tree).
module json
  implicit none
  character(len=:), allocatable :: s
  integer(8) :: pos = 1
  integer(8) :: objects = 0, int_sum = 0, str_len = 0, trues = 0, nulls = 0
contains
  subroutine skip()
    do while (pos <= len(s))
      if (s(pos:pos) /= ' ' .and. s(pos:pos) /= achar(10) .and. s(pos:pos) /= achar(13) .and. s(pos:pos) /= achar(9)) exit
      pos = pos + 1
    end do
  end subroutine

  ! returns the length in characters of the string starting at the quote at pos
  function parse_string() result(n)
    integer(8) :: n
    n = 0
    pos = pos + 1
    do while (s(pos:pos) /= '"')
      if (s(pos:pos) == '\') then
        if (s(pos + 1:pos + 1) == 'u') then
          pos = pos + 6
        else
          pos = pos + 2
        end if
      else
        pos = pos + 1
      end if
      n = n + 1
    end do
    pos = pos + 1
  end function

  recursive subroutine parse_value()
    character :: c
    integer(8) :: v, sgn, n
    call skip()
    c = s(pos:pos)
    select case (c)
    case ('{')
      objects = objects + 1
      pos = pos + 1
      call skip()
      if (s(pos:pos) == '}') then
        pos = pos + 1
        return
      end if
      do
        call skip()
        n = parse_string()          ! key: not counted
        call skip()
        pos = pos + 1               ! colon
        call parse_value()
        call skip()
        c = s(pos:pos)
        pos = pos + 1
        if (c == '}') exit
      end do
    case ('[')
      pos = pos + 1
      call skip()
      if (s(pos:pos) == ']') then
        pos = pos + 1
        return
      end if
      do
        call parse_value()
        call skip()
        c = s(pos:pos)
        pos = pos + 1
        if (c == ']') exit
      end do
    case ('"')
      str_len = str_len + parse_string()
    case ('t')
      trues = trues + 1
      pos = pos + 4
    case ('f')
      pos = pos + 5
    case ('n')
      nulls = nulls + 1
      pos = pos + 4
    case default
      sgn = 1
      if (c == '-') then
        sgn = -1
        pos = pos + 1
      end if
      v = 0
      do while (pos <= len(s))
        if (s(pos:pos) < '0' .or. s(pos:pos) > '9') exit
        v = v * 10 + (iachar(s(pos:pos)) - 48)
        pos = pos + 1
      end do
      int_sum = int_sum + sgn * v
    end select
  end subroutine
end module


module problem
  use lb_hash
  use json, only: s, pos, objects, int_sum, str_len, trues, nulls, parse_value
  implicit none
contains
  subroutine lb_setup()
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
    s = data
  end subroutine

  subroutine lb_solve()
    pos = 1
    objects = 0; int_sum = 0; str_len = 0; trues = 0; nulls = 0
    call parse_value()
  end subroutine

  subroutine lb_emit()
    call lb_sink(objects); call lb_sink(int_sum); call lb_sink(str_len); call lb_sink(trues); call lb_sink(nulls)
  end subroutine

  subroutine lb_release()
    deallocate(s)
  end subroutine
end module
