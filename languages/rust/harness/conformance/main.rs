// conformance problem: sum, maximum and a checksum of 4096 int32 values
pub type Instance = Vec<i32>;
pub type Output = [i64; 4];

pub fn setup(_args: &[String]) {}
pub fn decode(data: &[u8]) -> Instance {
    data.chunks_exact(4).map(|c| i32::from_le_bytes([c[0], c[1], c[2], c[3]])).collect()
}
pub fn solve(a: Instance) -> Output {
    let (mut sum, mut mx, mut sq) = (0i64, 0i64, 0i64);
    for &x in &a {
        let v = x as i64;
        sum += v;
        if v > mx {
            mx = v;
        }
        sq = (sq + v * v) % 1000003;
    }
    [sum, mx, sq, a.len() as i64]
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink(v);
    }
}
