! Arrays are column-major, so they are stored transposed (a(k,i) = A[i][k]) to keep the inner loop contiguous.
program matmul_bench
  implicit none
  character(len=32) :: arg
  integer :: n, i, j, k
  real(8), allocatable :: a(:, :), b(:, :), c(:, :)
  real(8) :: aik, trace, total

  call get_command_argument(1, arg)
  read(arg, *) n
  allocate(a(n, n), b(n, n), c(n, n))
  do i = 0, n - 1
    do j = 0, n - 1
      a(j + 1, i + 1) = real(mod(i * 31 + j * 17, 10) + 1, 8)
      b(j + 1, i + 1) = real(mod(i * 13 + j * 7, 10) - 4, 8)
    end do
  end do
  c = 0.0d0
  do i = 1, n
    do k = 1, n
      aik = a(k, i)
      do j = 1, n
        c(j, i) = c(j, i) + aik * b(j, k)
      end do
    end do
  end do
  trace = 0.0d0
  do i = 1, n
    trace = trace + c(i, i)
  end do
  total = sum(c)
  write(*, '(a,i0)') 'trace=', int(trace, 8)
  write(*, '(a,i0)') 'sum=', int(total, 8)
  write(*, '(a,i0)') 'c00=', int(c(1, 1), 8)
  write(*, '(a,i0)') 'clast=', int(c(n, n), 8)
end program
