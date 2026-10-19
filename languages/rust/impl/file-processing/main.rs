use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};

pub type Instance = String; // path of the file
pub type Output = Vec<i64>;

pub fn setup(_args: &[String]) {}
pub fn decode(data: &[u8]) -> Instance {
    String::from_utf8(data.to_vec()).unwrap()
}
pub fn solve(path: Instance) -> Output {
    let f = File::open(path).unwrap();
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
    let mut out = vec![lines as i64, total as i64, freq.len() as i64, tc as i64, tw.len() as i64];
    out.extend(tw.bytes().map(|b| b as i64));
    out
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink(v);
    }
}
