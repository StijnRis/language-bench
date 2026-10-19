// language-bench harness for C#: see harness/CONTRACT.md. Compiled together with Problem.cs (the problem's
// Program.cs), a static class Problem with Setup(args), Decode(bytes), Solve(instance), Emit(result, sink)
// and optionally Release(instance, result); instance and result are opaque objects.
using System.Diagnostics;
using System.Text;

public static class Harness
{
    static double Num(string k, double d)
    {
        var v = Environment.GetEnvironmentVariable(k);
        return !string.IsNullOrEmpty(v) && double.TryParse(v, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var r) ? r : d;
    }

    static string Env(string k, string d)
    {
        var v = Environment.GetEnvironmentVariable(k);
        return string.IsNullOrEmpty(v) ? d : v;
    }

    static void Fail(string msg)
    {
        Console.Error.WriteLine("harness: " + msg);
        Environment.Exit(1);
    }

    static void ReadFull(Stream s, byte[] buf)
    {
        int off = 0;
        while (off < buf.Length)
        {
            int k = s.Read(buf, off, buf.Length - off);
            if (k <= 0) Fail("input ended early");
            off += k;
        }
    }

    static long Mono() => (long)(Stopwatch.GetTimestamp() * (1e9 / Stopwatch.Frequency));

    public static int Main(string[] args)
    {
        string input = Env("LB_INPUT", "none");
        double budget = Num("LB_BUDGET_SECONDS", 10) * 1e9;
        long minIters = (long)Num("LB_MIN_ITERS", 3), maxIters = (long)Num("LB_MAX_ITERS", 0), start = (long)Num("LB_START", 0);
        string gen = Env("LB_GEN", "/usr/local/bin/lbgen"), file = Env("LB_FILE", "/dev/shm/lb-input"), problem = Env("LB_PROBLEM", "");
        bool fileReady = Environment.GetEnvironmentVariable("LB_FILE_READY") != null;
        const long P1 = 2147483647L, P2 = 2147483629L;

        Problem.Setup(args);
        Stream stdin = Console.OpenStandardInput();
        var rows = new List<long[]>();
        double kernel = 0;
        long mono0 = Mono();
        long wall0 = (DateTime.UtcNow.Ticks - DateTime.UnixEpoch.Ticks) * 100;
        string reason = "budget";

        for (;;)
        {
            byte[] data;
            if (input == "stream")
            {
                var hdr = new byte[8];
                ReadFull(stdin, hdr);
                data = new byte[(long)BitConverter.ToUInt64(hdr, 0)];
                ReadFull(stdin, data);
            }
            else if (input == "file")
            {
                if (!fileReady)
                {
                    var psi = new ProcessStartInfo(gen) { UseShellExecute = false };
                    foreach (var a in new[] { "file", problem, (start + rows.Count).ToString(), file }) psi.ArgumentList.Add(a);
                    using var p = Process.Start(psi)!;
                    p.WaitForExit();
                    if (p.ExitCode != 0) Fail("generator failed");
                }
                data = Encoding.UTF8.GetBytes(file);
            }
            else
            {
                data = Array.Empty<byte>();
            }
            object inst = Problem.Decode(data);
            long t0 = Mono();
            object res = Problem.Solve(inst);
            long t1 = Mono();
            long h1 = 17, h2 = 19, n = 0;
            Problem.Emit(res, w =>
            {
                long m1 = ((w % P1) + P1) % P1, m2 = ((w % P2) + P2) % P2;
                h1 = (h1 * 1000003 + m1) % P1;
                h2 = (h2 * 999983 + m2) % P2;
                n++;
            });
            h1 = (h1 * 1000003 + n % P1) % P1;
            h2 = (h2 * 999983 + n % P2) % P2;
            Problem.Release(inst, res);
            if (input == "file" && !fileReady && File.Exists(file)) File.Delete(file);
            rows.Add(new[] { t0, t1, h1, h2 });
            kernel += t1 - t0;
            if (maxIters > 0 && rows.Count >= maxIters) { reason = "iters"; break; }
            if (kernel >= budget && rows.Count >= minIters) break;
        }

        var sb = new StringBuilder();
        sb.Append("LB 1 clock=Stopwatch.GetTimestamp\nSTART mono=").Append(mono0).Append(" wall=").Append(wall0).Append('\n');
        for (int i = 0; i < rows.Count; i++)
            sb.Append("ITER ").Append(i + 1).Append(" t0=").Append(rows[i][0]).Append(" t1=").Append(rows[i][1]).Append(" check=").Append(rows[i][2]).Append(':').Append(rows[i][3]).Append('\n');
        sb.Append("DONE iters=").Append(rows.Count).Append(" kernel_ns=").Append((long)kernel).Append(" reason=").Append(reason).Append('\n');
        Console.Out.Write(sb.ToString());
        Console.Out.Flush();
        return 0;
    }
}
