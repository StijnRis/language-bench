use std::env;

fn main() {
    let n: usize = env::args().nth(1).unwrap().parse().unwrap();
    let mut s = vec![true; n + 1];
    s[0] = false;
    s[1] = false;
    let mut p = 2;
    while p * p <= n {
        if s[p] {
            let mut m = p * p;
            while m <= n {
                s[m] = false;
                m += p;
            }
        }
        p += 1;
    }
    let mut count = 0u64;
    let mut last = 0usize;
    let mut sum = 0u64;
    for i in 2..=n {
        if s[i] {
            count += 1;
            last = i;
            sum += i as u64;
        }
    }
    println!("count={}", count);
    println!("last={}", last);
    println!("sum={}", sum);
}
