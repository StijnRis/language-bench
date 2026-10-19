// Binary trees, after the Computer Language Benchmarks Game (plain Box allocation, no arena).
use std::sync::atomic::{AtomicU64, Ordering};

static DEPTH: AtomicU64 = AtomicU64::new(14);
pub type Instance = ();
pub type Output = Vec<i64>;

struct Node {
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
}

fn make(d: u32) -> Box<Node> {
    if d == 0 {
        Box::new(Node { left: None, right: None })
    } else {
        Box::new(Node { left: Some(make(d - 1)), right: Some(make(d - 1)) })
    }
}

fn check(n: &Node) -> i64 {
    match (&n.left, &n.right) {
        (Some(l), Some(r)) => 1 + check(l) + check(r),
        _ => 1,
    }
}

pub fn setup(args: &[String]) {
    if let Some(a) = args.first() {
        DEPTH.store(a.parse().unwrap(), Ordering::Relaxed);
    }
}
pub fn decode(_data: &[u8]) -> Instance {}
pub fn solve(_: Instance) -> Output {
    let n = DEPTH.load(Ordering::Relaxed) as u32;
    let min_depth = 4;
    let max_depth = if n > min_depth + 2 { n } else { min_depth + 2 };
    let stretch = max_depth + 1;
    let mut out = vec![check(&make(stretch))];
    let long_lived = make(max_depth);
    let mut depth = min_depth;
    while depth <= max_depth {
        let iterations = 1i64 << (max_depth - depth + min_depth);
        let mut sum = 0;
        for _ in 0..iterations {
            sum += check(&make(depth));
        }
        out.push(iterations);
        out.push(sum);
        depth += 2;
    }
    out.push(check(&long_lived));
    out
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink(v);
    }
}
