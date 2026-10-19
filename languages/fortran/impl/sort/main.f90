! Fortran's standard library has no sort: this is a median-of-three quicksort with an insertion-sort tail.
module quick
  implicit none
contains
  recursive subroutine qsort(a, lo, hi)
    integer(4), intent(inout) :: a(:)
    integer, intent(in) :: lo, hi
    integer :: i, j, mid
    integer(4) :: pivot, t
    if (hi - lo < 16) then
      do i = lo + 1, hi
        t = a(i)
        j = i - 1
        do while (j >= lo)
          if (a(j) <= t) exit
          a(j + 1) = a(j)
          j = j - 1
        end do
        a(j + 1) = t
      end do
      return
    end if
    mid = lo + (hi - lo) / 2
    if (a(mid) < a(lo)) call swap(a(mid), a(lo))
    if (a(hi) < a(lo)) call swap(a(hi), a(lo))
    if (a(hi) < a(mid)) call swap(a(hi), a(mid))
    pivot = a(mid)
    i = lo
    j = hi
    do while (i <= j)
      do while (a(i) < pivot)
        i = i + 1
      end do
      do while (a(j) > pivot)
        j = j - 1
      end do
      if (i <= j) then
        call swap(a(i), a(j))
        i = i + 1
        j = j - 1
      end if
    end do
    call qsort(a, lo, j)
    call qsort(a, i, hi)
  end subroutine

  subroutine swap(p, q)
    integer(4), intent(inout) :: p, q
    integer(4) :: t
    t = p; p = q; q = t
  end subroutine
end module

program sort_bench
  use quick
  implicit none
  character(len=32) :: arg
  integer :: n, i
  integer(8) :: x, checksum
  integer(4), allocatable :: a(:)

  call get_command_argument(1, arg)
  read(arg, *) n
  allocate(a(n))
  x = 1
  do i = 1, n
    x = mod(x * 48271_8, 2147483647_8)
    a(i) = int(x, 4)
  end do

  call qsort(a, 1, n)

  checksum = 0
  do i = 1, n
    checksum = mod(checksum + int(i - 1, 8) * int(a(i), 8), 1000000007_8)
  end do
  write(*, '(a,i0)') 'first=', a(1)
  write(*, '(a,i0)') 'last=', a(n)
  write(*, '(a,i0)') 'median=', a(n / 2 + 1)
  write(*, '(a,i0)') 'checksum=', checksum
end program
