// std::string holds UTF-8 bytes; code points are counted by skipping continuation bytes.
#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

void lb_setup(int, char **) {}
void *lb_decode(const unsigned char *data, size_t len) { return new std::string(reinterpret_cast<const char *>(data), len); }
void *lb_solve(void *p) {
  const std::string &text = *static_cast<std::string *>(p);
  long codepoints = 0, words = 1;
  for (unsigned char c : text) {
    if ((c & 0xC0) != 0x80) codepoints++;
    if (c == ' ') words++;
  }
  long needle = 0;
  for (size_t q = text.find("er"); q != std::string::npos; q = text.find("er", q + 2)) needle++;
  std::string replaced = text;
  for (char &c : replaced)
    if (c == ' ') c = '_';
  uint64_t checksum = 0;
  for (unsigned char c : replaced) checksum += c;
  return new std::vector<int64_t>{(int64_t)text.size(), codepoints, words, needle, (int64_t)checksum};
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  for (int64_t v : *static_cast<std::vector<int64_t> *>(res)) sink(v);
}
void lb_release(void *inst, void *res) {
  delete static_cast<std::string *>(inst);
  delete static_cast<std::vector<int64_t> *>(res);
}
