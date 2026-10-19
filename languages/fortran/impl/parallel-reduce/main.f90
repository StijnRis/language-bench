module primes
  implicit none
contains
  pure function is_prime(n) result(p)
    integer(8), intent(in) :: n
    logical :: p
    integer(8) :: d
    p = .false.
    if (n < 2) return
    if (n < 4) then
      p = .true.
      return
    end if
    if (mod(n, 2_8) == 0) return
    d = 3
    do while (d * d <= n)
      if (mod(n, d) == 0) return
      d = d + 2
    end do
    p = .true.
  end function
end module

program parallel_reduce
  use primes
  use omp_lib
  implicit none
  character(len=32) :: a1, a2
  integer(8) :: n, i, total, cnt
  integer :: workers, t

  call get_command_argument(1, a1)
  call get_command_argument(2, a2)
  read(a1, *) n
  read(a2, *) workers
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
  write(*, '(a,i0)') 'primes=', total
end program
