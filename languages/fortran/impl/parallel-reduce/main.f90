module problem
  use lb_hash
  use omp_lib
  implicit none
  integer(8) :: n = 2000000_8, total
  integer :: workers = 4
contains
  subroutine lb_setup()
    character(len=32) :: a1, a2
    integer :: st
    call get_command_argument(1, a1, status=st)
    if (st == 0) read(a1, *) n
    call get_command_argument(2, a2, status=st)
    if (st == 0) read(a2, *) workers
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
  end subroutine

  pure function is_prime(k) result(p)
    integer(8), intent(in) :: k
    logical :: p
    integer(8) :: d
    p = .false.
    if (k < 2) return
    if (k < 4) then
      p = .true.
      return
    end if
    if (mod(k, 2_8) == 0) return
    d = 3
    do while (d * d <= k)
      if (mod(k, d) == 0) return
      d = d + 2
    end do
    p = .true.
  end function

  subroutine lb_solve()
    integer(8) :: i, cnt
    integer :: t
    total = 0
    ! thread t takes the numbers i with i mod workers = t
    !$omp parallel num_threads(workers) private(t, i, cnt) reduction(+:total)
    t = omp_get_thread_num()
    cnt = 0
    i = t
    do while (i < n)
      if (is_prime(i)) cnt = cnt + 1
      i = i + workers
    end do
    total = total + cnt
    !$omp end parallel
  end subroutine

  subroutine lb_emit()
    call lb_sink(total)
  end subroutine

  subroutine lb_release()
  end subroutine
end module
