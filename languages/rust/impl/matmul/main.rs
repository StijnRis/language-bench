use std::env;

fn main() {
    let n: usize = env::args().nth(1).unwrap().parse().unwrap();
    let mut a = vec![0f64; n * n];
    let mut b = vec![0f64; n * n];
    let mut c = vec![0f64; n * n];
    for i in 0..n {
        for j in 0..n {
            a[i * n + j] = ((i * 31 + j * 17) % 10 + 1) as f64;
            b[i * n + j] = ((i * 13 + j * 7) % 10) as f64 - 4.0;
        }
    }

    for i in 0..n {
        for k in 0..n {
            let aik = a[i * n + k];
            let brow = &b[k * n..(k + 1) * n];
            let crow = &mut c[i * n..(i + 1) * n];
            for j in 0..n {
                crow[j] += aik * brow[j];
            }
        }
    }

    let trace: f64 = (0..n).map(|i| c[i * n + i]).sum();
    let sum: f64 = c.iter().sum();
    println!("trace={}", trace as i64);
    println!("sum={}", sum as i64);
    println!("c00={}", c[0] as i64);
    println!("clast={}", c[n * n - 1] as i64);
}
