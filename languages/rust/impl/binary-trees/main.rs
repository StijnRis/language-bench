// Binary trees, after the Computer Language Benchmarks Game (single threaded, Box per node).
use std::env;

struct Node {
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
}

fn make_tree(d: u32) -> Box<Node> {
    if d == 0 {
        Box::new(Node { left: None, right: None })
    } else {
        Box::new(Node { left: Some(make_tree(d - 1)), right: Some(make_tree(d - 1)) })
    }
}

fn check(n: &Node) -> u64 {
    match (&n.left, &n.right) {
        (Some(l), Some(r)) => 1 + check(l) + check(r),
        _ => 1,
    }
}

fn main() {
    let n: u32 = env::args().nth(1).unwrap().parse().unwrap();
    let min_depth = 4;
    let max_depth = std::cmp::max(min_depth + 2, n);
    let stretch = max_depth + 1;

    println!("stretch tree of depth {}\t check: {}", stretch, check(&make_tree(stretch)));
    let long_lived = make_tree(max_depth);

    let mut depth = min_depth;
    while depth <= max_depth {
        let iterations = 1u32 << (max_depth - depth + min_depth);
        let mut sum = 0u64;
        for _ in 0..iterations {
            sum += check(&make_tree(depth));
        }
        println!("{}\t trees of depth {}\t check: {}", iterations, depth, sum);
        depth += 2;
    }

    println!("long lived tree of depth {}\t check: {}", max_depth, check(&long_lived));
}
