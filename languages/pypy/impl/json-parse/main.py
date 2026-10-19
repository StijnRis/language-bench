import json


def setup(args):
    pass


def decode(data):
    return data  # the bytes are parsed inside solve


def solve(data):
    doc = json.loads(data)
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
    return objects, int_sum, str_len, trues, nulls


def emit(res):
    return res
