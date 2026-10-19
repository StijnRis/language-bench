// start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
object Problem {
  def setup(args: Array[String]): Unit = ()
  def decode(data: Array[Byte]): Any = null
  def solve(inst: Any): Any = null
  def emit(res: Any, sink: Long => Unit): Unit = sink(1L)
  def release(inst: Any, res: Any): Unit = ()
}
