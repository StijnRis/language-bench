use std::env;
use std::thread;

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

fn main() {
    let n: u64 = env::args().nth(1).unwrap().parse().unwrap();
    let workers: u64 = env::args().nth(2).unwrap().parse().unwrap();

    let total: u64 = thread::scope(|s| {
        let handles: Vec<_> = (0..workers)
            .map(|t| {
                s.spawn(move || {
                    let mut c = 0u64;
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
    });

    println!("primes={}", total);
}
