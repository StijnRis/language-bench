! N-body simulation, after the Computer Language Benchmarks Game.
module problem
  use lb_hash
  implicit none
  integer, parameter :: nb = 5
  real(8), parameter :: pi = 3.141592653589793d0, solar_mass = 4.0d0 * pi * pi
  real(8) :: x(nb), y(nb), z(nb), vx(nb), vy(nb), vz(nb), m(nb)
  real(8) :: e0, e1
  integer :: steps = 1000000
contains
  subroutine lb_setup()
    character(len=32) :: arg
    integer :: st
    call get_command_argument(1, arg, status=st)
    if (st == 0) read(arg, *) steps
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
    real(8) :: v(35)
    integer :: b
    v = transfer(data(1:280), v)
    do b = 1, nb
      x(b) = v(7 * b - 6); y(b) = v(7 * b - 5); z(b) = v(7 * b - 4)
      vx(b) = v(7 * b - 3); vy(b) = v(7 * b - 2); vz(b) = v(7 * b - 1); m(b) = v(7 * b)
    end do
  end subroutine

  subroutine lb_solve()
    real(8) :: px, py, pz
    integer :: s
    px = sum(vx * m); py = sum(vy * m); pz = sum(vz * m)
    vx(1) = -px / solar_mass
    vy(1) = -py / solar_mass
    vz(1) = -pz / solar_mass
    e0 = energy()
    do s = 1, steps
      call advance(0.01d0)
    end do
    e1 = energy()
  end subroutine

  subroutine lb_emit()
    call lb_sink(floor(e0 * 1.0d9 + 0.5d0, 8))
    call lb_sink(floor(e1 * 1.0d9 + 0.5d0, 8))
  end subroutine

  subroutine lb_release()
  end subroutine

  function energy() result(e)
    real(8) :: e, dx, dy, dz
    integer :: i, j
    e = 0.0d0
    do i = 1, nb
      e = e + 0.5d0 * m(i) * (vx(i)**2 + vy(i)**2 + vz(i)**2)
      do j = i + 1, nb
        dx = x(i) - x(j); dy = y(i) - y(j); dz = z(i) - z(j)
        e = e - m(i) * m(j) / sqrt(dx * dx + dy * dy + dz * dz)
      end do
    end do
  end function

  subroutine advance(dt)
    real(8), intent(in) :: dt
    real(8) :: dx, dy, dz, d2, mag, bm, cm
    integer :: i, j
    do i = 1, nb
      do j = i + 1, nb
        dx = x(i) - x(j); dy = y(i) - y(j); dz = z(i) - z(j)
        d2 = dx * dx + dy * dy + dz * dz
        mag = dt / (d2 * sqrt(d2))
        bm = m(i) * mag
        cm = m(j) * mag
        vx(i) = vx(i) - dx * cm; vy(i) = vy(i) - dy * cm; vz(i) = vz(i) - dz * cm
        vx(j) = vx(j) + dx * bm; vy(j) = vy(j) + dy * bm; vz(j) = vz(j) + dz * bm
      end do
    end do
    x = x + dt * vx
    y = y + dt * vy
    z = z + dt * vz
  end subroutine
end module
