! Arrays are column-major, so the row-major input reshapes to the transposed matrices (a(k,i) = A[i][k]):
! the inner loop over j is contiguous.
module problem
  use lb_hash
  implicit none
  integer :: n
  real(8), allocatable :: a(:, :), b(:, :), c(:, :)
contains
  subroutine lb_setup()
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
    integer(4) :: n4
    real(8), allocatable :: flat(:)
    n4 = transfer(data(1:4), n4)
    n = n4
    allocate(flat(n * n))
    flat = transfer(data(5:4 + 8 * n * n), flat)
    allocate(a(n, n), b(n, n))
    a = reshape(flat, [n, n])
    flat = transfer(data(5 + 8 * n * n:4 + 16 * n * n), flat)
    b = reshape(flat, [n, n])
    allocate(c(n, n))
  end subroutine

  subroutine lb_solve()
    integer :: i, j, k
    real(8) :: aik
    c = 0.0d0
    do i = 1, n
      do k = 1, n
        aik = a(k, i)
        do j = 1, n
          c(j, i) = c(j, i) + aik * b(j, k)
        end do
      end do
    end do
  end subroutine

  subroutine lb_emit()
    integer :: i, j
    do i = 1, n
      do j = 1, n
        call lb_sink(floor(c(j, i) + 0.5d0, 8))
      end do
    end do
  end subroutine

  subroutine lb_release()
    deallocate(a, b, c)
  end subroutine
end module
