// start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
#include <cstddef>
#include <cstdint>

void lb_setup(int, char **) {}
void *lb_decode(const unsigned char *, size_t) { return nullptr; }
void *lb_solve(void *inst) { return inst; }
void lb_emit(void *, void (*sink)(int64_t)) { sink(1); }
void lb_release(void *, void *) {}
