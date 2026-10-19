use std::sync::atomic::{AtomicU64, Ordering};

static N: AtomicU64 = AtomicU64::new(10_000_000);
pub type Instance = ();
pub type Output = [i64; 3];

pub fn setup(args: &[String]) {
    if let Some(a) = args.first() {
        N.store(a.parse().unwrap(), Ordering::Relaxed);
    }
}
pub fn decode(_data: &[u8]) -> Instance {}
pub fn solve(_: Instance) -> Output {
    let n = N.load(Ordering::Relaxed) as usize;
    let mut composite = vec![false; n + 1];
    let mut p = 2;
    while p * p <= n {
        if !composite[p] {
            let mut m = p * p;
            while m <= n {
                composite[m] = true;
                m += p;
            }
        }
        p += 1;
    }
    let (mut count, mut last, mut sum) = (0i64, 0i64, 0i64);
    for i in 2..=n {
        if !composite[i] {
            count += 1;
            last = i as i64;
            sum += i as i64;
        }
    }
    [count, last, sum]
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink(v);
    }
}
