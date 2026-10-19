/* start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem */
#include <stdint.h>
#include <stddef.h>

void lb_setup(int argc, char **argv) { (void)argc; (void)argv; }
void *lb_decode(const unsigned char *data, size_t len) { (void)data; (void)len; return NULL; }
void *lb_solve(void *inst) { return inst; }
void lb_emit(void *res, void (*sink)(int64_t)) { (void)res; sink(1); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
