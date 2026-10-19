// language-bench harness for Rust: see harness/CONTRACT.md. Built together with problem.rs (the problem's main.rs).
// The problem provides: setup(&[String]), decode(&[u8]) -> Instance, solve(Instance) -> Output,
// emit(&Output, &mut dyn FnMut(i64)); the types stay opaque to the harness.
mod problem;

use std::env;
use std::fmt::Write as _;
use std::io::Read;
use std::process::Command;

#[repr(C)]
struct Timespec {
    tv_sec: i64,
    tv_nsec: i64,
}
extern "C" {
    fn clock_gettime(clk: i32, ts: *mut Timespec) -> i32;
}
fn now(clk: i32) -> i64 {
    let mut t = Timespec { tv_sec: 0, tv_nsec: 0 };
    unsafe { clock_gettime(clk, &mut t) };
    t.tv_sec * 1_000_000_000 + t.tv_nsec
}
const REALTIME: i32 = 0;
const MONOTONIC: i32 = 1;

/// an optimisation barrier that works on every toolchain (std::hint::black_box needs 1.66)
fn black_box<T>(x: T) -> T {
    unsafe {
        let r = std::ptr::read_volatile(&x);
        std::mem::forget(x);
        r
    }
}

fn num(k: &str, d: f64) -> f64 {
    env::var(k).ok().and_then(|v| v.parse().ok()).unwrap_or(d)
}

fn main() {
    let input = env::var("LB_INPUT").unwrap_or_else(|_| "none".into());
    let budget = num("LB_BUDGET_SECONDS", 10.0) * 1e9;
    let min_iters = num("LB_MIN_ITERS", 3.0) as u64;
    let max_iters = num("LB_MAX_ITERS", 0.0) as u64;
    let start = num("LB_START", 0.0) as u64;
    let gen = env::var("LB_GEN").unwrap_or_else(|_| "/usr/local/bin/lbgen".into());
    let file = env::var("LB_FILE").unwrap_or_else(|_| "/dev/shm/lb-input".into());
    let problem_name = env::var("LB_PROBLEM").unwrap_or_default();
    let file_ready = env::var("LB_FILE_READY").is_ok();

    let args: Vec<String> = env::args().skip(1).collect();
    problem::setup(&args);

    let stdin = std::io::stdin();
    let mut stdin = stdin.lock();
    let mut buf: Vec<u8> = Vec::new();
    let mut rows: Vec<(i64, i64, i64, i64)> = Vec::new();
    let mut kernel: f64 = 0.0;
    let mono0 = now(MONOTONIC);
    let wall0 = now(REALTIME);
    let mut reason = "budget";

    loop {
        let iters = rows.len() as u64;
        let result;
        let (t0, t1);
        let (h1, h2, words);
        {
            if input == "stream" {
                let mut hdr = [0u8; 8];
                if stdin.read_exact(&mut hdr).is_err() {
                    eprintln!("harness: input ended early");
                    std::process::exit(1);
                }
                let len = u64::from_le_bytes(hdr) as usize;
                buf.resize(len, 0);
                if stdin.read_exact(&mut buf).is_err() {
                    eprintln!("harness: input ended early");
                    std::process::exit(1);
                }
            } else if input == "file" {
                if !file_ready {
                    let ok = Command::new(&gen).args(["file", &problem_name, &(start + iters).to_string(), &file]).status().map(|s| s.success()).unwrap_or(false);
                    if !ok {
                        eprintln!("harness: generator failed");
                        std::process::exit(1);
                    }
                }
                buf.clear();
                buf.extend_from_slice(file.as_bytes());
            } else {
                buf.clear();
            }
            let inst = black_box(problem::decode(&buf));
            t0 = now(MONOTONIC);
            let out = problem::solve(inst);
            t1 = now(MONOTONIC);
            let out = black_box(out);
            let (mut a, mut b, mut n) = (17i64, 19i64, 0i64);
            let mut mix = |w: i64| {
                let m1 = ((w % 2147483647) + 2147483647) % 2147483647;
                let m2 = ((w % 2147483629) + 2147483629) % 2147483629;
                a = (a * 1000003 + m1) % 2147483647;
                b = (b * 999983 + m2) % 2147483629;
            };
            problem::emit(&out, &mut |w| {
                mix(w);
                n += 1;
            });
            mix(n);
            h1 = a;
            h2 = b;
            words = n;
            result = ();
        }
        let _ = (result, words);
        if input == "file" && !file_ready {
            let _ = std::fs::remove_file(&file);
        }
        rows.push((t0, t1, h1, h2));
        kernel += (t1 - t0) as f64;
        if max_iters > 0 && rows.len() as u64 >= max_iters {
            reason = "iters";
            break;
        }
        if kernel >= budget && rows.len() as u64 >= min_iters {
            break;
        }
    }

    let mut o = String::new();
    let _ = writeln!(o, "LB 1 clock=CLOCK_MONOTONIC\nSTART mono={} wall={}", mono0, wall0);
    for (i, (t0, t1, h1, h2)) in rows.iter().enumerate() {
        let _ = writeln!(o, "ITER {} t0={} t1={} check={}:{}", i + 1, t0, t1, h1, h2);
    }
    let _ = writeln!(o, "DONE iters={} kernel_ns={} reason={}", rows.len(), kernel as i64, reason);
    print!("{}", o);
}
