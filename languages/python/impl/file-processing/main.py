def setup(args):
    pass


def decode(data):
    return data.decode()  # path of the file


def solve(path):
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
    return lines, total, len(freq), top[1], top[0]


def emit(res):
    lines, total, distinct, count, word = res
    return [lines, total, distinct, count, len(word)] + list(word.encode("ascii"))
