# CRuby has a global VM lock, so the workers are forked processes (like Python's multiprocessing).
module Problem
  @n = 2_000_000
  @workers = 4

  def self.setup(args)
    return if args.length < 2
    @n = args[0].to_i
    @workers = args[1].to_i
  end

  def self.decode(data)
    nil
  end

  def self.prime?(n)
    return false if n < 2
    return true if n < 4
    return false if n.even?
    d = 3
    while d * d <= n
      return false if n % d == 0
      d += 2
    end
    true
  end

  def self.solve(_)
    n = @n
    workers = @workers
    pipes = (0...workers).map do |t|
      r, w = IO.pipe
      pid = fork do
        r.close
        count = 0
        i = t
        while i < n
          count += 1 if prime?(i)
          i += workers
        end
        w.puts count
        w.close
        exit!(0)
      end
      w.close
      [pid, r]
    end
    total = pipes.sum do |pid, r|
      count = r.read.to_i
      r.close
      Process.wait(pid)
      count
    end
    [total]
  end

  def self.emit(r)
    r
  end
end
