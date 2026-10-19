! Character variables hold the bytes of the UTF-8 text; code points are the bytes that are not continuation bytes.
module problem
  use lb_hash
  implicit none
  character(len=:), allocatable :: text
  integer(8) :: bytes, codepoints, spaces, needle, checksum
contains
  subroutine lb_setup()
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
    text = data
  end subroutine

  subroutine lb_solve()
    integer(8) :: i, total
    integer :: c
    total = len(text)
    bytes = total
    codepoints = 0; spaces = 0; checksum = 0; needle = 0
    do i = 1, total
      c = iand(iachar(text(i:i)), 255)
      if (iand(c, 192) /= 128) codepoints = codepoints + 1
      if (c == 32) then
        spaces = spaces + 1
        checksum = checksum + 95
      else
        checksum = checksum + c
      end if
    end do
    i = 1
    do while (i < total)
      if (text(i:i) == 'e' .and. text(i + 1:i + 1) == 'r') then
        needle = needle + 1
        i = i + 2
      else
        i = i + 1
      end if
    end do
  end subroutine

  subroutine lb_emit()
    call lb_sink(bytes); call lb_sink(codepoints); call lb_sink(spaces + 1); call lb_sink(needle); call lb_sink(checksum)
  end subroutine

  subroutine lb_release()
    deallocate(text)
  end subroutine
end module
