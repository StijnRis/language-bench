use std::env;

fn main() {
    let n: usize = env::args().nth(1).unwrap().parse().unwrap();
    let mut x: u64 = 1;
    let mut a: Vec<i32> = Vec::with_capacity(n);
    for _ in 0..n {
        x = x * 48271 % 2147483647;
        a.push(x as i32);
    }

    a.sort_unstable();

    let mut checksum: u64 = 0;
    for (i, v) in a.iter().enumerate() {
        checksum = (checksum + i as u64 * *v as u64) % 1000000007;
    }

    println!("first={}", a[0]);
    println!("last={}", a[n - 1]);
    println!("median={}", a[n / 2]);
    println!("checksum={}", checksum);
}
