program fannkuch
  implicit none
  character(len=32) :: arg
  integer :: n, i, j, k, r, t, p0, flips, maxflips
  integer(8) :: permcount, checksum
  integer, allocatable :: perm1(:), perm(:), count(:)
  logical :: searching

  call get_command_argument(1, arg)
  read(arg, *) n
  allocate(perm1(0:n - 1), perm(0:n - 1), count(0:n - 1))
  do i = 0, n - 1
    perm1(i) = i
  end do
  maxflips = 0
  permcount = 0
  checksum = 0
  r = n
  do
    do while (r /= 1)
      count(r - 1) = r
      r = r - 1
    end do
    perm = perm1
    flips = 0
    k = perm(0)
    do while (k /= 0)
      i = 0
      j = k
      do while (i < j)
        t = perm(i); perm(i) = perm(j); perm(j) = t
        i = i + 1
        j = j - 1
      end do
      flips = flips + 1
      k = perm(0)
    end do
    if (flips > maxflips) maxflips = flips
    if (mod(permcount, 2_8) == 0) then
      checksum = checksum + flips
    else
      checksum = checksum - flips
    end if
    searching = .true.
    do while (searching)
      if (r == n) then
        write(*, '(a,i0)') 'checksum=', checksum
        write(*, '(a,i0)') 'maxflips=', maxflips
        stop
      end if
      p0 = perm1(0)
      do i = 0, r - 1
        perm1(i) = perm1(i + 1)
      end do
      perm1(r) = p0
      count(r) = count(r) - 1
      if (count(r) > 0) then
        searching = .false.
      else
        r = r + 1
      end if
    end do
    permcount = permcount + 1
  end do
end program
