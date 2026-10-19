import sys

VOCAB = [
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world",
]


def main(n):
    x = 1
    words = []
    for _ in range(n):
        x = x * 48271 % 2147483647
        words.append(VOCAB[x % len(VOCAB)])
    text = " ".join(words)

    encoded = text.replace(" ", "_").encode("utf-8")
    checksum = sum(encoded)

    print(f"bytes={len(text.encode('utf-8'))}")
    print(f"codepoints={len(text)}")
    print(f"words={len(text.split(' '))}")
    print(f"needle={text.count('er')}")
    print(f"checksum={checksum}")


main(int(sys.argv[1]))
