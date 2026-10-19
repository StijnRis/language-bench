! language-bench harness for Fortran (see harness/CONTRACT.md): the hash of the canonical result words.
! A problem's lb_emit calls lb_sink(w) for every word.
module lb_hash
  implicit none
  integer(8), parameter :: p1 = 2147483647_8, p2 = 2147483629_8
  integer(8) :: h1 = 17, h2 = 19, nwords = 0
contains
  subroutine lb_reset()
    h1 = 17; h2 = 19; nwords = 0
  end subroutine

  subroutine mix(w)
    integer(8), intent(in) :: w
    h1 = mod(h1 * 1000003_8 + modulo(w, p1), p1)
    h2 = mod(h2 * 999983_8 + modulo(w, p2), p2)
  end subroutine

  subroutine lb_sink(w)
    integer(8), intent(in) :: w
    call mix(w)
    nwords = nwords + 1
  end subroutine

  subroutine lb_finish()
    call mix(nwords)
  end subroutine
end module
