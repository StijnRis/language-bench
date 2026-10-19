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


module problem
  use lb_hash
  use quick
  implicit none
  integer(4), allocatable :: a(:)
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
    call qsort(a, 1, size(a))
  end subroutine

  subroutine lb_emit()
    integer :: i
    do i = 1, size(a)
      call lb_sink(int(a(i), 8))
    end do
  end subroutine

  subroutine lb_release()
    deallocate(a)
  end subroutine
end module
