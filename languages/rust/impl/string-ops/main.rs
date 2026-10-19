// Rust strings are UTF-8: len() is the byte length, chars() iterates code points.
pub type Instance = String;
pub type Output = [i64; 5];

pub fn setup(_args: &[String]) {}
pub fn decode(data: &[u8]) -> Instance {
    String::from_utf8(data.to_vec()).unwrap()
}
pub fn solve(text: Instance) -> Output {
    let replaced = text.replace(' ', "_");
    let checksum: u64 = replaced.bytes().map(|b| b as u64).sum();
    [text.len() as i64, text.chars().count() as i64, text.bytes().filter(|&b| b == b' ').count() as i64 + 1, text.matches("er").count() as i64, checksum as i64]
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink(v);
    }
}
