<?php
// language-bench harness for PHP: see harness/CONTRACT.md.
// usage: php harness.php <problem.php> [problem arguments]
// The problem file defines final class Problem with static setup(args), decode(bytes), solve(instance),
// emit(result) -> array of integers (the canonical result words) and optionally release(instance, result).
require $argv[1];

function lb_num(string $k, float $d): float
{
    $v = getenv($k);
    return ($v !== false && $v !== "") ? (float) $v : $d;
}

function lb_read($stream, int $n): string
{
    $buf = "";
    while (strlen($buf) < $n) {
        $chunk = fread($stream, min($n - strlen($buf), 1 << 24));
        if ($chunk === false || $chunk === "") {
            fwrite(STDERR, "harness: input ended early\n");
            exit(1);
        }
        $buf .= $chunk;
    }
    return $buf;
}

$input = getenv("LB_INPUT") ?: "none";
$budget = lb_num("LB_BUDGET_SECONDS", 10) * 1e9;
$minIters = (int) lb_num("LB_MIN_ITERS", 3);
$maxIters = (int) lb_num("LB_MAX_ITERS", 0);
$start = (int) lb_num("LB_START", 0);
$gen = getenv("LB_GEN") ?: "/usr/local/bin/lbgen";
$file = getenv("LB_FILE") ?: "/dev/shm/lb-input";
$pname = getenv("LB_PROBLEM") ?: "";
$fileReady = getenv("LB_FILE_READY") !== false;
$P1 = 2147483647;
$P2 = 2147483629;

Problem::setup(array_slice($argv, 2));
$rows = [];
$kernel = 0;
$mono0 = hrtime(true);
$wall0 = (int) (microtime(true) * 1e6) * 1000;
$reason = "budget";

while (true) {
    if ($input === "stream") {
        $len = unpack("P", lb_read(STDIN, 8))[1];
        $data = $len > 0 ? lb_read(STDIN, $len) : "";
    } elseif ($input === "file") {
        if (!$fileReady) {
            $cmd = escapeshellarg($gen) . " file " . escapeshellarg($pname) . " " . ($start + count($rows)) . " " . escapeshellarg($file);
            passthru($cmd, $rc);
            if ($rc !== 0) {
                fwrite(STDERR, "harness: generator failed\n");
                exit(1);
            }
        }
        $data = $file;
    } else {
        $data = "";
    }
    $inst = Problem::decode($data);
    $t0 = hrtime(true);
    $res = Problem::solve($inst);
    $t1 = hrtime(true);
    $h1 = 17;
    $h2 = 19;
    $words = Problem::emit($res);
    $n = count($words);
    foreach ($words as $w) {
        $h1 = ($h1 * 1000003 + (($w % $P1) + $P1) % $P1) % $P1;
        $h2 = ($h2 * 999983 + (($w % $P2) + $P2) % $P2) % $P2;
    }
    $h1 = ($h1 * 1000003 + $n % $P1) % $P1;
    $h2 = ($h2 * 999983 + $n % $P2) % $P2;
    if (method_exists("Problem", "release")) {
        Problem::release($inst, $res);
    }
    $inst = $res = $words = $data = null;
    if ($input === "file" && !$fileReady && file_exists($file)) {
        unlink($file);
    }
    $rows[] = [$t0, $t1, $h1, $h2];
    $kernel += $t1 - $t0;
    if ($maxIters > 0 && count($rows) >= $maxIters) {
        $reason = "iters";
        break;
    }
    if ($kernel >= $budget && count($rows) >= $minIters) {
        break;
    }
}

$out = ["LB 1 clock=hrtime", "START mono=$mono0 wall=$wall0"];
foreach ($rows as $i => $r) {
    $out[] = "ITER " . ($i + 1) . " t0={$r[0]} t1={$r[1]} check={$r[2]}:{$r[3]}";
}
$out[] = "DONE iters=" . count($rows) . " kernel_ns=$kernel reason=$reason";
fwrite(STDOUT, implode("\n", $out) . "\n");
