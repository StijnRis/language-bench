module Problem
  @n = 9

  def self.setup(args)
    @n = args[0].to_i unless args.empty?
  end

  def self.decode(data)
    nil
  end

  def self.solve(_)
    n = @n
    perm1 = (0...n).to_a
    count = Array.new(n, 0)
    maxflips = 0
    permcount = 0
    checksum = 0
    r = n
    loop do
      while r != 1
        count[r - 1] = r
        r -= 1
      end
      perm = perm1.dup
      flips = 0
      while (k = perm[0]) != 0
        i = 0
        j = k
        while i < j
          perm[i], perm[j] = perm[j], perm[i]
          i += 1
          j -= 1
        end
        flips += 1
      end
      maxflips = flips if flips > maxflips
      checksum += permcount.even? ? flips : -flips
      loop do
        return [checksum, maxflips] if r == n
        p0 = perm1[0]
        i = 0
        while i < r
          perm1[i] = perm1[i + 1]
          i += 1
        end
        perm1[r] = p0
        count[r] -= 1
        break if count[r] > 0
        r += 1
      end
      permcount += 1
    end
  end

  def self.emit(r)
    r
  end
end
