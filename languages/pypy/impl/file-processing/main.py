import sys


def main(path):
    lines = 0
    total = 0
    freq = {}
    with open(path, "r", encoding="ascii") as f:
        for line in f:
            _, word, value = line.rstrip("\n").split(",")
            lines += 1
            total += int(value)
            freq[word] = freq.get(word, 0) + 1

    top = min(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    print(f"lines={lines}")
    print(f"sum={total}")
    print(f"distinct={len(freq)}")
    print(f"top={top[0]} {top[1]}")


main(sys.argv[1])
