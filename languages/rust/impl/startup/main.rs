// start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
pub type Instance = ();
pub type Output = ();

pub fn setup(_args: &[String]) {}
pub fn decode(_data: &[u8]) -> Instance {}
pub fn solve(_: Instance) -> Output {}
pub fn emit(_: &Output, sink: &mut dyn FnMut(i64)) {
    sink(1);
}
