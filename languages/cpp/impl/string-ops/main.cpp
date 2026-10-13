// std::string holds UTF-8 bytes; code points are counted by skipping continuation bytes.
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <string>

static const char *VOCAB[20] = {
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world",
};

int main(int, char **argv) {
  long n = std::atol(argv[1]);
  uint64_t x = 1;
  std::string text;
  for (long i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    if (i > 0) text.push_back(' ');
    text.append(VOCAB[x % 20]);
  }

  long codepoints = 0, words = 1;
  for (unsigned char c : text) {
    if ((c & 0xC0) != 0x80) codepoints++;
    if (c == ' ') words++;
  }

  long needle = 0;
  for (size_t p = text.find("er"); p != std::string::npos; p = text.find("er", p + 2)) needle++;

  std::string replaced = text;
  for (char &c : replaced)
    if (c == ' ') c = '_';
  uint64_t checksum = 0;
  for (unsigned char c : replaced) checksum += c;

  std::printf("bytes=%zu\n", text.size());
  std::printf("codepoints=%ld\n", codepoints);
  std::printf("words=%ld\n", words);
  std::printf("needle=%ld\n", needle);
  std::printf("checksum=%llu\n", (unsigned long long)checksum);
  return 0;
}
