import json
import sys


def main(path):
    with open(path, "rb") as f:
        doc = json.load(f)

    objects = 0
    int_sum = 0
    str_len = 0
    trues = 0
    nulls = 0
    stack = [doc]
    while stack:
        v = stack.pop()
        if isinstance(v, dict):
            objects += 1
            stack.extend(v.values())
        elif isinstance(v, list):
            stack.extend(v)
        elif isinstance(v, str):
            str_len += len(v)
        elif v is True:
            trues += 1
        elif v is None:
            nulls += 1
        elif isinstance(v, int):
            int_sum += v

    print(f"objects={objects}")
    print(f"int_sum={int_sum}")
    print(f"string_length={str_len}")
    print(f"true={trues}")
    print(f"null={nulls}")


main(sys.argv[1])
