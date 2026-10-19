# language-bench harness for Ruby: see harness/CONTRACT.md.
# usage: ruby harness.rb <problem.rb> [problem arguments]
# The problem file defines module Problem with setup(args), decode(bytes), solve(instance),
# emit(result) -> array of integers (the canonical result words) and optionally release(instance, result).
require File.expand_path(ARGV[0])

def num(k, d)
  v = ENV[k]
  v && !v.empty? ? v.to_f : d
end

mono = -> { Process.clock_gettime(Process::CLOCK_MONOTONIC, :nanosecond) }
wall = -> { Process.clock_gettime(Process::CLOCK_REALTIME, :nanosecond) }

inp = ENV["LB_INPUT"] || "none"
budget = num("LB_BUDGET_SECONDS", 10) * 1e9
min_iters = num("LB_MIN_ITERS", 3).to_i
max_iters = num("LB_MAX_ITERS", 0).to_i
start = num("LB_START", 0).to_i
gen = ENV["LB_GEN"] || "/usr/local/bin/lbgen"
file = ENV["LB_FILE"] || "/dev/shm/lb-input"
pname = ENV["LB_PROBLEM"] || ""
file_ready = ENV.key?("LB_FILE_READY")
p1 = 2_147_483_647
p2 = 2_147_483_629

Problem.setup(ARGV[1..-1])
STDIN.binmode
rows = []
kernel = 0
mono0 = mono.call
wall0 = wall.call
reason = "budget"

loop do
  case inp
  when "stream"
    hdr = STDIN.read(8)
    if hdr.nil? || hdr.bytesize < 8
      STDERR.puts "harness: input ended early"
      exit 1
    end
    len = hdr.unpack1("Q<")
    data = len.zero? ? "".b : STDIN.read(len)
    if data.nil? || data.bytesize < len
      STDERR.puts "harness: input ended early"
      exit 1
    end
  when "file"
    unless file_ready
      unless system(gen, "file", pname, (start + rows.length).to_s, file)
        STDERR.puts "harness: generator failed"
        exit 1
      end
    end
    data = file.b
  else
    data = "".b
  end
  inst = Problem.decode(data)
  t0 = mono.call
  res = Problem.solve(inst)
  t1 = mono.call
  h1 = 17
  h2 = 19
  words = Problem.emit(res)
  n = words.length
  words.each do |w|
    h1 = (h1 * 1_000_003 + w % p1) % p1
    h2 = (h2 * 999_983 + w % p2) % p2
  end
  h1 = (h1 * 1_000_003 + n % p1) % p1
  h2 = (h2 * 999_983 + n % p2) % p2
  Problem.release(inst, res) if Problem.respond_to?(:release)
  inst = res = words = data = nil
  File.delete(file) if inp == "file" && !file_ready && File.exist?(file)
  rows << [t0, t1, h1, h2]
  kernel += t1 - t0
  if max_iters > 0 && rows.length >= max_iters
    reason = "iters"
    break
  end
  break if kernel >= budget && rows.length >= min_iters
end

out = ["LB 1 clock=Process.clock_gettime(CLOCK_MONOTONIC)", "START mono=#{mono0} wall=#{wall0}"]
rows.each_with_index { |r, i| out << "ITER #{i + 1} t0=#{r[0]} t1=#{r[1]} check=#{r[2]}:#{r[3]}" }
out << "DONE iters=#{rows.length} kernel_ns=#{kernel} reason=#{reason}"
STDOUT.write(out.join("\n") + "\n")
