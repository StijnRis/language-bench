def setup(args):
    pass


def decode(data):
    return data.decode("utf-8")


def solve(text):
    encoded = text.replace(" ", "_").encode("utf-8")
    return len(text.encode("utf-8")), len(text), text.count(" ") + 1, text.count("er"), sum(encoded)


def emit(res):
    return res
