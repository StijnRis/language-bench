pub type Instance = Vec<i32>;
pub type Output = Vec<i32>;

pub fn setup(_args: &[String]) {}
pub fn decode(data: &[u8]) -> Instance {
    data.chunks_exact(4).map(|c| i32::from_le_bytes([c[0], c[1], c[2], c[3]])).collect()
}
pub fn solve(mut a: Instance) -> Output {
    a.sort_unstable();
    a
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink(v as i64);
    }
}
