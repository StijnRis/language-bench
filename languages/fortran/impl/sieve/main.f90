module problem
  use lb_hash
  implicit none
  integer(8) :: n = 10000000_8, count, last, total
contains
  subroutine lb_setup()
    character(len=32) :: arg
    integer :: st
    call get_command_argument(1, arg, status=st)
    if (st == 0) read(arg, *) n
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
  end subroutine

  subroutine lb_solve()
    integer(8) :: p, m, i
    logical(1), allocatable :: composite(:)
    allocate(composite(0:n))
    composite = .false.
    p = 2
    do while (p * p <= n)
      if (.not. composite(p)) then
        do m = p * p, n, p
          composite(m) = .true.
        end do
      end if
      p = p + 1
    end do
    count = 0; last = 0; total = 0
    do i = 2, n
      if (.not. composite(i)) then
        count = count + 1
        last = i
        total = total + i
      end if
    end do
  end subroutine

  subroutine lb_emit()
    call lb_sink(count); call lb_sink(last); call lb_sink(total)
  end subroutine

  subroutine lb_release()
  end subroutine
end module
