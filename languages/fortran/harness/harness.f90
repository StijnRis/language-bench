! language-bench harness for Fortran: see harness/CONTRACT.md. Built together with lb_hash.f90 and problem.f90
! (the problem's main.f90), a module `problem` with lb_setup(), lb_decode(data), lb_solve(), lb_emit() and
! lb_release(); instance and result live in the module's own variables.
! Time is system_clock (CLOCK_MONOTONIC, nanoseconds in gfortran); the one wall-clock reading comes from libc.
program harness
  use iso_c_binding
  use lb_hash
  use problem
  implicit none
  interface
    function c_clock_gettime(clk, ts) bind(C, name='clock_gettime') result(r)
      import :: c_int, c_long
      integer(c_int), value :: clk
      integer(c_long) :: ts(2)
      integer(c_int) :: r
    end function
    ! gfortran reports a short read on a pipe as end of file, so standard input is read through libc
    function c_read(fd, buf, n) bind(C, name='read') result(r)
      import :: c_int, c_char, c_size_t, c_long
      integer(c_int), value :: fd
      character(kind=c_char), dimension(*) :: buf
      integer(c_size_t), value :: n
      integer(c_long) :: r
    end function
  end interface

  character(len=16) :: input
  character(len=512) :: gen, file, pname
  character(len=:), allocatable :: buf
  character(len=8) :: hdr
  real(8) :: budget
  integer(8) :: min_iters, max_iters, start, iters, cap, len8, mono0, wall0, t0, t1, kernel
  integer(8), allocatable :: rt0(:), rt1(:), rc1(:), rc2(:), tmp(:)
  logical :: file_ready, fin
  character(len=8) :: reason
  integer :: u, du, ios, es
  integer(8) :: i
  character(len=32) :: tmps
  integer(c_long) :: ts(2)
  integer(c_int) :: rc

  call getenv_str('LB_INPUT', 'none', input)
  call getenv_str('LB_GEN', '/usr/local/bin/lbgen', gen)
  call getenv_str('LB_FILE', '/dev/shm/lb-input', file)
  call getenv_str('LB_PROBLEM', '', pname)
  call getenv_str('LB_FILE_READY', '', tmps)
  file_ready = len_trim(tmps) > 0
  budget = getenv_num('LB_BUDGET_SECONDS', 10.0d0) * 1.0d9
  min_iters = nint(getenv_num('LB_MIN_ITERS', 3.0d0), 8)
  max_iters = nint(getenv_num('LB_MAX_ITERS', 0.0d0), 8)
  start = nint(getenv_num('LB_START', 0.0d0), 8)

  call lb_setup()
  cap = 1024
  allocate(rt0(cap), rt1(cap), rc1(cap), rc2(cap))
  iters = 0; kernel = 0; reason = 'budget'
  mono0 = now_mono()
  rc = c_clock_gettime(0_c_int, ts)
  wall0 = int(ts(1), 8) * 1000000000_8 + int(ts(2), 8)

  fin = .false.
  do while (.not. fin)
    select case (trim(input))
    case ('stream')
      call read_full(hdr, 8_8)
      len8 = transfer(hdr, len8)
      allocate(character(len=len8) :: buf)
      call read_full(buf, len8)
      call lb_decode(buf)
      deallocate(buf)
    case ('file')
      if (.not. file_ready) then
        write(tmps, '(i0)') start + iters
        call execute_command_line("'" // trim(gen) // "' file " // trim(pname) // ' ' // trim(tmps) // " '" // trim(file) // "'", &
                                  wait=.true., exitstat=es)
        if (es /= 0) call die('harness: generator failed')
      end if
      call lb_decode(trim(file))
    case default
      call lb_decode('')
    end select

    t0 = now_mono()
    call lb_solve()
    t1 = now_mono()
    call lb_reset()
    call lb_emit()
    call lb_finish()
    call lb_release()
    if (trim(input) == 'file' .and. .not. file_ready) then
      open(newunit=du, file=trim(file), status='old', iostat=ios)
      if (ios == 0) close(du, status='delete')
    end if

    if (iters == cap) then
      cap = cap * 2
      call grow(rt0); call grow(rt1); call grow(rc1); call grow(rc2)
    end if
    iters = iters + 1
    rt0(iters) = t0; rt1(iters) = t1; rc1(iters) = h1; rc2(iters) = h2
    kernel = kernel + (t1 - t0)
    if (max_iters > 0 .and. iters >= max_iters) then
      reason = 'iters'
      fin = .true.
    else if (real(kernel, 8) >= budget .and. iters >= min_iters) then
      fin = .true.
    end if
  end do

  write(*, '(a)') 'LB 1 clock=system_clock'
  write(*, '(a,i0,a,i0)') 'START mono=', mono0, ' wall=', wall0
  do i = 1, iters
    write(*, '(a,i0,a,i0,a,i0,a,i0,a,i0)') 'ITER ', i, ' t0=', rt0(i), ' t1=', rt1(i), ' check=', rc1(i), ':', rc2(i)
  end do
  write(*, '(a,i0,a,i0,a,a)') 'DONE iters=', iters, ' kernel_ns=', kernel, ' reason=', trim(reason)

contains
  function now_mono() result(ns)
    integer(8) :: ns, c, r
    call system_clock(c, r)
    ns = c * (1000000000_8 / r)
  end function

  subroutine getenv_str(name, def, out)
    character(len=*), intent(in) :: name, def
    character(len=*), intent(out) :: out
    integer :: st
    call get_environment_variable(name, out, status=st)
    if (st /= 0 .or. len_trim(out) == 0) out = def
  end subroutine

  function getenv_num(name, def) result(v)
    character(len=*), intent(in) :: name
    real(8), intent(in) :: def
    real(8) :: v
    character(len=64) :: s
    integer :: st, ios2
    call get_environment_variable(name, s, status=st)
    v = def
    if (st == 0 .and. len_trim(s) > 0) then
      read(s, *, iostat=ios2) v
      if (ios2 /= 0) v = def
    end if
  end function

  subroutine grow(a)
    integer(8), allocatable, intent(inout) :: a(:)
    integer(8), allocatable :: b(:)
    allocate(b(cap))
    b(1:cap / 2) = a
    call move_alloc(b, a)
  end subroutine

  subroutine read_full(b, n)
    character(len=*), intent(inout) :: b
    integer(8), intent(in) :: n
    integer(8) :: got
    integer(c_long) :: k
    got = 0
    do while (got < n)
      k = c_read(0_c_int, b(got + 1:), int(n - got, c_size_t))
      if (k <= 0) call die('harness: input ended early')
      got = got + k
    end do
  end subroutine

  subroutine die(msg)
    character(len=*), intent(in) :: msg
    write(0, '(a)') msg
    stop 1
  end subroutine
end program
