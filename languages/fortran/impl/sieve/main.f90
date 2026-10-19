program sieve
  implicit none
  character(len=32) :: arg
  integer(8) :: n, p, m, count, last, total, i
  logical(1), allocatable :: composite(:)

  call get_command_argument(1, arg)
  read(arg, *) n
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
  write(*, '(a,i0)') 'count=', count
  write(*, '(a,i0)') 'last=', last
  write(*, '(a,i0)') 'sum=', total
end program
