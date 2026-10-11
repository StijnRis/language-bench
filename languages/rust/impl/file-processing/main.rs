use std::collections::HashMap;
use std::env;
use std::fs::File;
use std::io::{BufRead, BufReader};

fn main() {
    let f = File::open(env::args().nth(1).unwrap()).unwrap();
    let mut reader = BufReader::with_capacity(1 << 16, f);

    let mut freq: HashMap<String, u64> = HashMap::new();
    let mut lines = 0u64;
    let mut total = 0u64;
    let mut line = String::new();
    while reader.read_line(&mut line).unwrap() > 0 {
        let mut parts = line.trim_end().split(',');
        parts.next();
        let word = parts.next().unwrap();
        let value: u64 = parts.next().unwrap().parse().unwrap();
        total += value;
        match freq.get_mut(word) {
            Some(c) => *c += 1,
            None => {
                freq.insert(word.to_string(), 1);
            }
        }
        lines += 1;
        line.clear();
    }

    let mut top: Option<(&String, u64)> = None;
    for (w, &c) in &freq {
        top = match top {
            Some((tw, tc)) if tc > c || (tc == c && tw < w) => Some((tw, tc)),
            _ => Some((w, c)),
        };
    }
    let (tw, tc) = top.unwrap();

    println!("lines={}", lines);
    println!("sum={}", total);
    println!("distinct={}", freq.len());
    println!("top={} {}", tw, tc);
}
