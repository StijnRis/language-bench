! Fortran has no hash map in its standard library: an open-addressing table with linear probing.
module problem
  use lb_hash
  implicit none
  integer(8), parameter :: mask = 4194303_8     ! 2**22 - 1 slots, load factor about 0.25
  integer(8), parameter :: empty = huge(0_8)
  integer(4), allocatable :: keys_in(:), look(:)
  integer(8), allocatable :: keys(:), vals(:)
  integer(8) :: distinct, checksum, hits
contains
  subroutine lb_setup()
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
    integer :: n
    n = len(data) / 8
    allocate(keys_in(n), look(n))
    keys_in = transfer(data(1:4 * n), keys_in)
    look = transfer(data(4 * n + 1:8 * n), look)
  end subroutine

  subroutine lb_solve()
    integer(8) :: i, k, h
    allocate(keys(0:mask), vals(0:mask))
    keys = empty
    vals = 0
    distinct = 0
    do i = 1, size(keys_in)
      k = keys_in(i)
      h = iand(k * 2654435761_8, mask)
      do
        if (keys(h) == k) then
          vals(h) = vals(h) + 1
          exit
        else if (keys(h) == empty) then
          keys(h) = k
          vals(h) = 1
          distinct = distinct + 1
          exit
        end if
        h = iand(h + 1, mask)
      end do
    end do
    checksum = 0
    do h = 0, mask
      if (keys(h) /= empty) checksum = checksum + keys(h) * vals(h)
    end do
    hits = 0
    do i = 1, size(look)
      k = look(i)
      h = iand(k * 2654435761_8, mask)
      do
        if (keys(h) == k) then
          hits = hits + vals(h)
          exit
        else if (keys(h) == empty) then
          exit
        end if
        h = iand(h + 1, mask)
      end do
    end do
  end subroutine

  subroutine lb_emit()
    call lb_sink(distinct); call lb_sink(checksum); call lb_sink(hits)
  end subroutine

  subroutine lb_release()
    deallocate(keys_in, look, keys, vals)
  end subroutine
end module
