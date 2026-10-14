use std::env;

fn main() {
    let n: usize = env::args().nth(1).unwrap().parse().unwrap();
    let mut perm1: Vec<usize> = (0..n).collect();
    let mut perm = vec![0usize; n];
    let mut count = vec![0usize; n];
    let mut maxflips = 0i64;
    let mut checksum = 0i64;
    let mut permcount = 0u64;
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
            perm[..k + 1].reverse();
            flips += 1;
        }
        if flips > maxflips {
            maxflips = flips;
        }
        checksum += if permcount % 2 == 0 { flips } else { -flips };
        loop {
            if r == n {
                println!("checksum={}", checksum);
                println!("maxflips={}", maxflips);
                return;
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
