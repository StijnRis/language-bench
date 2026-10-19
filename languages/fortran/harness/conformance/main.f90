! conformance problem: sum, maximum and a checksum of 4096 int32 values
module problem
  use lb_hash
  implicit none
  integer(4), allocatable :: a(:)
  integer(8) :: s, m, sq, cnt
contains
  subroutine lb_setup()
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
    integer :: n
    n = len(data) / 4
    allocate(a(n))
    a = transfer(data(1:4 * n), a)
  end subroutine

  subroutine lb_solve()
    integer :: i
    s = 0; m = 0; sq = 0
    do i = 1, size(a)
      s = s + a(i)
      m = max(m, int(a(i), 8))
      sq = mod(sq + int(a(i), 8) * int(a(i), 8), 1000003_8)
    end do
    cnt = size(a)
  end subroutine

  subroutine lb_emit()
    call lb_sink(s); call lb_sink(m); call lb_sink(sq); call lb_sink(cnt)
  end subroutine

  subroutine lb_release()
    deallocate(a)
  end subroutine
end module
