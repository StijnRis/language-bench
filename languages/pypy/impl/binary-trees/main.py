# Binary trees, after the Computer Language Benchmarks Game.
import sys


def make_tree(d):
    if d == 0:
        return (None, None)
    d -= 1
    return (make_tree(d), make_tree(d))


def check_tree(node):
    left, right = node
    if left is None:
        return 1
    return 1 + check_tree(left) + check_tree(right)


def main(n):
    min_depth = 4
    max_depth = max(min_depth + 2, n)
    stretch_depth = max_depth + 1

    print(f"stretch tree of depth {stretch_depth}\t check: {check_tree(make_tree(stretch_depth))}")
    long_lived = make_tree(max_depth)

    for depth in range(min_depth, max_depth + 1, 2):
        iterations = 1 << (max_depth - depth + min_depth)
        check = 0
        for _ in range(iterations):
            check += check_tree(make_tree(depth))
        print(f"{iterations}\t trees of depth {depth}\t check: {check}")

    print(f"long lived tree of depth {max_depth}\t check: {check_tree(long_lived)}")


main(int(sys.argv[1]))
