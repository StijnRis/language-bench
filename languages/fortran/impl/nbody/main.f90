! N-body simulation, after the Computer Language Benchmarks Game.
program nbody
  implicit none
  integer, parameter :: nb = 5
  real(8), parameter :: pi = 3.141592653589793d0, solar_mass = 4.0d0 * pi * pi, days = 365.24d0
  real(8) :: x(nb), y(nb), z(nb), vx(nb), vy(nb), vz(nb), m(nb)
  real(8) :: px, py, pz
  character(len=32) :: arg
  integer :: steps, s

  x = [0.0d0, 4.84143144246472090d+00, 8.34336671824457987d+00, 1.28943695621391310d+01, 1.53796971148509165d+01]
  y = [0.0d0, -1.16032004402742839d+00, 4.12479856412430479d+00, -1.51111514016986312d+01, -2.59193146099879641d+01]
  z = [0.0d0, -1.03622044471123109d-01, -4.03523417114321381d-01, -2.23307578892655734d-01, 1.79258772950371181d-01]
  vx = [0.0d0, 1.66007664274403694d-03, -2.76742510726862411d-03, 2.96460137564761618d-03, 2.68067772490389322d-03] * days
  vy = [0.0d0, 7.69901118419740425d-03, 4.99852801234917238d-03, 2.37847173959480950d-03, 1.62824170038242295d-03] * days
  vz = [0.0d0, -6.90460016972063023d-05, 2.30417297573763929d-05, -2.96589568540237556d-05, -9.51592254519715870d-05] * days
  m = [1.0d0, 9.54791938424326609d-04, 2.85885980666130812d-04, 4.36624404335156298d-05, 5.15138902046611451d-05] * solar_mass

  px = sum(vx * m); py = sum(vy * m); pz = sum(vz * m)
  vx(1) = -px / solar_mass
  vy(1) = -py / solar_mass
  vz(1) = -pz / solar_mass

  call get_command_argument(1, arg)
  read(arg, *) steps
  call show(energy())
  do s = 1, steps
    call advance(0.01d0)
  end do
  call show(energy())

contains
  subroutine show(e)
    real(8), intent(in) :: e
    character(len=32) :: buf
    write(buf, '(F16.9)') e
    write(*, '(a)') trim(adjustl(buf))
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
end program
