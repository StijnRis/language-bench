! start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
module problem
  use lb_hash
  implicit none
contains
  subroutine lb_setup()
  end subroutine
  subroutine lb_decode(data)
    character(len=*), intent(in) :: data
  end subroutine
  subroutine lb_solve()
  end subroutine
  subroutine lb_emit()
    call lb_sink(1_8)
  end subroutine
  subroutine lb_release()
  end subroutine
end module
