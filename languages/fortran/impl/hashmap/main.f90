! Fortran has no hash map in its standard library: an open-addressing table with linear probing.
program hashmap
  implicit none
  character(len=32) :: arg
  integer(8) :: n, x, i, k, half, checksum, hits
  integer(8), parameter :: mask = 4194303_8     ! 2**22 - 1 slots, load factor about 0.1
  integer(8), allocatable :: keys(:), vals(:)
  integer(8) :: h, distinct

  call get_command_argument(1, arg)
  read(arg, *) n
  allocate(keys(0:mask), vals(0:mask))
  keys = -1
  vals = 0
  x = 1
  half = n / 2
  distinct = 0
  do i = 1, n
    x = mod(x * 48271_8, 2147483647_8)
    k = mod(x, half)
    h = iand(k * 2654435761_8, mask)
    do
      if (keys(h) == k) then
        vals(h) = vals(h) + 1
        exit
      else if (keys(h) == -1) then
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
    if (keys(h) /= -1) checksum = checksum + keys(h) * vals(h)
  end do

  hits = 0
  do i = 1, n
    x = mod(x * 48271_8, 2147483647_8)
    k = mod(x, n)
    h = iand(k * 2654435761_8, mask)
    do
      if (keys(h) == k) then
        hits = hits + vals(h)
        exit
      else if (keys(h) == -1) then
        exit
      end if
      h = iand(h + 1, mask)
    end do
  end do

  write(*, '(a,i0)') 'distinct=', distinct
  write(*, '(a,i0)') 'checksum=', checksum
  write(*, '(a,i0)') 'hits=', hits
end program
