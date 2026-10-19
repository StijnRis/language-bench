! Binary trees, after the Computer Language Benchmarks Game.
module problem
  use lb_hash
  implicit none
  type node
    type(node), pointer :: l => null(), r => null()
  end type
  integer :: depth_arg = 14
  integer(8), allocatable :: words(:)
  integer :: nw
contains
  subroutine lb_setup()
    character(len=32) :: arg
    integer :: st
    call get_command_argument(1, arg, status=st)
    if (st == 0) read(arg, *) depth_arg
  end subroutine

  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
  end subroutine

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

  recursive subroutine free_tree(t)
    type(node), pointer :: t
    if (associated(t%l)) then
      call free_tree(t%l)
      call free_tree(t%r)
    end if
    deallocate(t)
  end subroutine

  subroutine lb_solve()
    integer :: min_depth, max_depth, d
    integer(8) :: iterations, i, total
    type(node), pointer :: t, long_lived
    min_depth = 4
    max_depth = max(min_depth + 2, depth_arg)
    allocate(words(2 + 2 * ((max_depth - min_depth) / 2 + 1)))
    nw = 0
    t => make(max_depth + 1)
    nw = nw + 1; words(nw) = check(t)
    call free_tree(t)
    long_lived => make(max_depth)
    do d = min_depth, max_depth, 2
      iterations = ishft(1_8, max_depth - d + min_depth)
      total = 0
      do i = 1, iterations
        t => make(d)
        total = total + check(t)
        call free_tree(t)
      end do
      nw = nw + 1; words(nw) = iterations
      nw = nw + 1; words(nw) = total
    end do
    nw = nw + 1; words(nw) = check(long_lived)
    call free_tree(long_lived)
  end subroutine

  subroutine lb_emit()
    integer :: i
    do i = 1, nw
      call lb_sink(words(i))
    end do
  end subroutine

  subroutine lb_release()
    deallocate(words)
  end subroutine
end module
