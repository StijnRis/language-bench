use std::sync::atomic::{AtomicU64, Ordering};

static N: AtomicU64 = AtomicU64::new(9);
pub type Instance = ();
pub type Output = [i64; 2];

pub fn setup(args: &[String]) {
    if let Some(a) = args.first() {
        N.store(a.parse().unwrap(), Ordering::Relaxed);
    }
}
pub fn decode(_data: &[u8]) -> Instance {}
pub fn solve(_: Instance) -> Output {
    let n = N.load(Ordering::Relaxed) as usize;
    let mut perm1: Vec<usize> = (0..n).collect();
    let mut perm = vec![0usize; n];
    let mut count = vec![0usize; n];
    let (mut maxflips, mut permcount, mut checksum) = (0i64, 0i64, 0i64);
    let mut r = n;
    loop {
        while r != 1 {
            count[r - 1] = r;
            r -= 1;
        }
        perm.copy_from_slice(&perm1);
        let mut flips = 0i64;
        loop {
            let k = perm[0];
            if k == 0 {
                break;
            }
            perm[..=k].reverse();
            flips += 1;
        }
        if flips > maxflips {
            maxflips = flips;
        }
        checksum += if permcount % 2 == 0 { flips } else { -flips };
        loop {
            if r == n {
                return [checksum, maxflips];
            }
            let p0 = perm1[0];
            for i in 0..r {
                perm1[i] = perm1[i + 1];
            }
            perm1[r] = p0;
            count[r] -= 1;
            if count[r] > 0 {
                break;
            }
            r += 1;
        }
        permcount += 1;
    }
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink(v);
    }
}
