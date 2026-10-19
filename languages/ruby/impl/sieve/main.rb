module Problem
  @n = 10_000_000

  def self.setup(args)
    @n = args[0].to_i unless args.empty?
  end

  def self.decode(data)
    nil
  end

  def self.solve(_)
    n = @n
    # a byte string with setbyte is Ruby's compact array of flags
    s = "\x01".b * (n + 1)
    s.setbyte(0, 0)
    s.setbyte(1, 0)
    p = 2
    while p * p <= n
      if s.getbyte(p) == 1
        m = p * p
        while m <= n
          s.setbyte(m, 0)
          m += p
        end
      end
      p += 1
    end
    count = last = sum = 0
    i = 2
    while i <= n
      if s.getbyte(i) == 1
        count += 1
        last = i
        sum += i
      end
      i += 1
    end
    [count, last, sum]
  end

  def self.emit(r)
    r
  end
end
