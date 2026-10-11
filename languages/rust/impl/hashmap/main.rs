use std::collections::HashMap;
use std::env;

fn main() {
    let n: u64 = env::args().nth(1).unwrap().parse().unwrap();
    let mut x: u64 = 1;
    let mut next = || {
        x = x * 48271 % 2147483647;
        x
    };

    let mut m: HashMap<u64, u64> = HashMap::new();
    for _ in 0..n {
        *m.entry(next() % (n / 2)).or_insert(0) += 1;
    }

    let checksum: u64 = m.iter().map(|(k, c)| k * c).sum();

    let mut hits: u64 = 0;
    for _ in 0..n {
        hits += m.get(&(next() % n)).copied().unwrap_or(0);
    }

    println!("distinct={}", m.len());
    println!("checksum={}", checksum);
    println!("hits={}", hits);
}
