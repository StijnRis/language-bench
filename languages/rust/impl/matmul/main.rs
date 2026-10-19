pub struct Instance {
    n: usize,
    a: Vec<f64>,
    b: Vec<f64>,
}
pub type Output = Vec<f64>;

pub fn setup(_args: &[String]) {}
pub fn decode(data: &[u8]) -> Instance {
    let n = i32::from_le_bytes([data[0], data[1], data[2], data[3]]) as usize;
    let f = |off: usize| -> Vec<f64> {
        data[off..off + n * n * 8].chunks_exact(8).map(|c| f64::from_le_bytes([c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7]])).collect()
    };
    Instance { n, a: f(4), b: f(4 + n * n * 8) }
}
pub fn solve(inst: Instance) -> Output {
    let n = inst.n;
    let mut c = vec![0.0f64; n * n];
    for i in 0..n {
        for k in 0..n {
            let aik = inst.a[i * n + k];
            let brow = &inst.b[k * n..(k + 1) * n];
            let crow = &mut c[i * n..(i + 1) * n];
            for j in 0..n {
                crow[j] += aik * brow[j];
            }
        }
    }
    c
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &v in out {
        sink((v + if v < 0.0 { -0.5 } else { 0.5 }) as i64);
    }
}
