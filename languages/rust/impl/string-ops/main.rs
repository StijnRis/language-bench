use std::env;

const VOCAB: [&str; 20] = [
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world",
];

fn main() {
    let n: usize = env::args().nth(1).unwrap().parse().unwrap();
    let mut x: u64 = 1;
    let mut words: Vec<&str> = Vec::with_capacity(n);
    for _ in 0..n {
        x = x * 48271 % 2147483647;
        words.push(VOCAB[(x % VOCAB.len() as u64) as usize]);
    }
    let text = words.join(" ");

    let replaced = text.replace(' ', "_");
    let checksum: u64 = replaced.bytes().map(|b| b as u64).sum();

    println!("bytes={}", text.len());
    println!("codepoints={}", text.chars().count());
    println!("words={}", text.split(' ').count());
    println!("needle={}", text.matches("er").count());
    println!("checksum={}", checksum);
}
