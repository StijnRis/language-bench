! Binary trees, after the Computer Language Benchmarks Game.
module trees
  implicit none
  type node
    type(node), pointer :: l => null(), r => null()
  end type
contains
  recursive function make(d) result(t)
    integer, intent(in) :: d
    type(node), pointer :: t
    allocate(t)
    if (d > 0) then
      t%l => make(d - 1)
      t%r => make(d - 1)
    end if
  end function

  recursive function check(t) result(c)
    type(node), pointer :: t
    integer(8) :: c
    c = 1
    if (associated(t%l)) c = 1 + check(t%l) + check(t%r)
  end function

  recursive subroutine release(t)
    type(node), pointer :: t
    if (associated(t%l)) then
      call release(t%l)
      call release(t%r)
    end if
    deallocate(t)
  end subroutine
end module

program binary_trees
  use trees
  implicit none
  character(len=32) :: arg
  integer :: n, min_depth, max_depth, stretch, depth
  integer(8) :: iterations, i, total
  type(node), pointer :: t, long_lived

  call get_command_argument(1, arg)
  read(arg, *) n
  min_depth = 4
  max_depth = max(min_depth + 2, n)
  stretch = max_depth + 1

  t => make(stretch)
  write(*, '(a,i0,a,i0)') 'stretch tree of depth ', stretch, achar(9)//' check: ', check(t)
  call release(t)
  long_lived => make(max_depth)

  do depth = min_depth, max_depth, 2
    iterations = ishft(1_8, max_depth - depth + min_depth)
    total = 0
    do i = 1, iterations
      t => make(depth)
      total = total + check(t)
      call release(t)
    end do
    write(*, '(i0,a,i0,a,i0)') iterations, achar(9)//' trees of depth ', depth, achar(9)//' check: ', total
  end do

  write(*, '(a,i0,a,i0)') 'long lived tree of depth ', max_depth, achar(9)//' check: ', check(long_lived)
end program
