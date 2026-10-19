// N-body simulation, after the Computer Language Benchmarks Game.
use std::sync::atomic::{AtomicU64, Ordering};

const PI: f64 = 3.141592653589793;
const SOLAR_MASS: f64 = 4.0 * PI * PI;
static STEPS: AtomicU64 = AtomicU64::new(1_000_000);

#[derive(Clone, Copy)]
pub struct Body {
    x: f64,
    y: f64,
    z: f64,
    vx: f64,
    vy: f64,
    vz: f64,
    mass: f64,
}
pub type Instance = [Body; 5];
pub type Output = [f64; 2];

fn energy(b: &[Body; 5]) -> f64 {
    let mut e = 0.0;
    for i in 0..5 {
        e += 0.5 * b[i].mass * (b[i].vx * b[i].vx + b[i].vy * b[i].vy + b[i].vz * b[i].vz);
        for j in (i + 1)..5 {
            let dx = b[i].x - b[j].x;
            let dy = b[i].y - b[j].y;
            let dz = b[i].z - b[j].z;
            e -= (b[i].mass * b[j].mass) / (dx * dx + dy * dy + dz * dz).sqrt();
        }
    }
    e
}

pub fn setup(args: &[String]) {
    if let Some(a) = args.first() {
        STEPS.store(a.parse().unwrap(), Ordering::Relaxed);
    }
}
pub fn decode(data: &[u8]) -> Instance {
    let f = |i: usize| f64::from_le_bytes([data[i * 8], data[i * 8 + 1], data[i * 8 + 2], data[i * 8 + 3], data[i * 8 + 4], data[i * 8 + 5], data[i * 8 + 6], data[i * 8 + 7]]);
    let mut b = [Body { x: 0.0, y: 0.0, z: 0.0, vx: 0.0, vy: 0.0, vz: 0.0, mass: 0.0 }; 5];
    for (i, body) in b.iter_mut().enumerate() {
        *body = Body { x: f(i * 7), y: f(i * 7 + 1), z: f(i * 7 + 2), vx: f(i * 7 + 3), vy: f(i * 7 + 4), vz: f(i * 7 + 5), mass: f(i * 7 + 6) };
    }
    b
}
pub fn solve(mut b: Instance) -> Output {
    let (mut px, mut py, mut pz) = (0.0, 0.0, 0.0);
    for body in b.iter() {
        px += body.vx * body.mass;
        py += body.vy * body.mass;
        pz += body.vz * body.mass;
    }
    b[0].vx = -px / SOLAR_MASS;
    b[0].vy = -py / SOLAR_MASS;
    b[0].vz = -pz / SOLAR_MASS;
    let e0 = energy(&b);
    let dt = 0.01;
    for _ in 0..STEPS.load(Ordering::Relaxed) {
        for i in 0..5 {
            for j in (i + 1)..5 {
                let dx = b[i].x - b[j].x;
                let dy = b[i].y - b[j].y;
                let dz = b[i].z - b[j].z;
                let d2 = dx * dx + dy * dy + dz * dz;
                let mag = dt / (d2 * d2.sqrt());
                let bm = b[i].mass * mag;
                let cm = b[j].mass * mag;
                b[i].vx -= dx * cm;
                b[i].vy -= dy * cm;
                b[i].vz -= dz * cm;
                b[j].vx += dx * bm;
                b[j].vy += dy * bm;
                b[j].vz += dz * bm;
            }
        }
        for body in b.iter_mut() {
            body.x += dt * body.vx;
            body.y += dt * body.vy;
            body.z += dt * body.vz;
        }
    }
    [e0, energy(&b)]
}
pub fn emit(out: &Output, sink: &mut dyn FnMut(i64)) {
    for &e in out {
        sink((e * 1e9 + 0.5).floor() as i64);
    }
}
