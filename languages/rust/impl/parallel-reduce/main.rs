use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;

static N: AtomicU64 = AtomicU64::new(2_000_000);
static WORKERS: AtomicU64 = AtomicU64::new(4);
pub type Instance = ();
pub type Output = i64;

fn is_prime(n: u64) -> bool {
    if n < 2 {
        return false;
    }
    if n < 4 {
        return true;
    }
    if n % 2 == 0 {
        return false;
    }
    let mut d = 3;
    while d * d <= n {
        if n % d == 0 {
            return false;
        }
        d += 2;
    }
    true
}

pub fn setup(args: &[String]) {
    if args.len() > 1 {
        N.store(args[0].parse().unwrap(), Ordering::Relaxed);
        WORKERS.store(args[1].parse().unwrap(), Ordering::Relaxed);
    }
}
pub fn decode(_data: &[u8]) -> Instance {}
pub fn solve(_: Instance) -> Output {
    let n = N.load(Ordering::Relaxed);
    let workers = WORKERS.load(Ordering::Relaxed);
    let handles: Vec<_> = (0..workers)
        .map(|t| {
            thread::spawn(move || {
                let mut c = 0i64;
                let mut i = t;
                while i < n {
                    if is_prime(i) {
                        c += 1;
                    }
                    i += workers;
                }
                c
            })
        })
        .collect();
    handles.into_iter().map(|h| h.join().unwrap()).sum()
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    sink(*out);
}
