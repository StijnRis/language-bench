// Rust has no JSON parser in its standard library: this is a small recursive-descent parser that
// aggregates while parsing (it does not build a tree).
use std::env;
use std::fs;

#[derive(Default)]
struct Stats {
    objects: u64,
    int_sum: i64,
    str_len: u64,
    trues: u64,
    nulls: u64,
}

struct Parser<'a> {
    s: &'a [u8],
    i: usize,
    st: Stats,
}

impl<'a> Parser<'a> {
    fn ws(&mut self) {
        while self.i < self.s.len() && matches!(self.s[self.i], b' ' | b'\n' | b'\r' | b'\t') {
            self.i += 1;
        }
    }

    /// Parses a string literal starting at the opening quote; returns its length in characters.
    fn string(&mut self) -> u64 {
        self.i += 1;
        let mut n = 0;
        loop {
            match self.s[self.i] {
                b'"' => {
                    self.i += 1;
                    return n;
                }
                b'\\' => {
                    if self.s[self.i + 1] == b'u' {
                        self.i += 6;
                    } else {
                        self.i += 2;
                    }
                    n += 1;
                }
                _ => {
                    self.i += 1;
                    n += 1;
                }
            }
        }
    }

    fn value(&mut self) {
        self.ws();
        match self.s[self.i] {
            b'{' => {
                self.st.objects += 1;
                self.i += 1;
                self.ws();
                if self.s[self.i] == b'}' {
                    self.i += 1;
                    return;
                }
                loop {
                    self.ws();
                    self.string(); // key
                    self.ws();
                    self.i += 1; // ':'
                    self.value();
                    self.ws();
                    let c = self.s[self.i];
                    self.i += 1;
                    if c == b'}' {
                        return;
                    }
                }
            }
            b'[' => {
                self.i += 1;
                self.ws();
                if self.s[self.i] == b']' {
                    self.i += 1;
                    return;
                }
                loop {
                    self.value();
                    self.ws();
                    let c = self.s[self.i];
                    self.i += 1;
                    if c == b']' {
                        return;
                    }
                }
            }
            b'"' => {
                let n = self.string();
                self.st.str_len += n;
            }
            b't' => {
                self.st.trues += 1;
                self.i += 4;
            }
            b'f' => self.i += 5,
            b'n' => {
                self.st.nulls += 1;
                self.i += 4;
            }
            _ => {
                let neg = self.s[self.i] == b'-';
                if neg {
                    self.i += 1;
                }
                let mut v: i64 = 0;
                while self.i < self.s.len() && self.s[self.i].is_ascii_digit() {
                    v = v * 10 + (self.s[self.i] - b'0') as i64;
                    self.i += 1;
                }
                self.st.int_sum += if neg { -v } else { v };
            }
        }
    }
}

fn main() {
    let data = fs::read(env::args().nth(1).unwrap()).unwrap();
    let mut p = Parser { s: &data, i: 0, st: Stats::default() };
    p.value();
    println!("objects={}", p.st.objects);
    println!("int_sum={}", p.st.int_sum);
    println!("string_length={}", p.st.str_len);
    println!("true={}", p.st.trues);
    println!("null={}", p.st.nulls);
}
