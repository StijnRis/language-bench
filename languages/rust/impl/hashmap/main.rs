use std::collections::HashMap;

pub struct Instance {
    keys: Vec<u32>,
    lookups: Vec<u32>,
}
pub type Output = [u64; 3];

pub fn setup(_args: &[String]) {}
pub fn decode(data: &[u8]) -> Instance {
    let all: Vec<u32> = data.chunks_exact(4).map(|c| u32::from_le_bytes([c[0], c[1], c[2], c[3]])).collect();
    let n = all.len() / 2;
    Instance { keys: all[..n].to_vec(), lookups: all[n..].to_vec() }
}
pub fn solve(inst: Instance) -> Output {
    let mut m: HashMap<u32, u64> = HashMap::new();
    for &k in &inst.keys {
        *m.entry(k).or_insert(0) += 1;
    }
    let checksum: u64 = m.iter().map(|(&k, &c)| k as u64 * c).sum();
    let mut hits: u64 = 0;
    for k in &inst.lookups {
        hits += m.get(k).copied().unwrap_or(0);
    }
    [m.len() as u64, checksum, hits]
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink(v as i64);
    }
}
