<?php
// PHP has no threads in the CLI build, so the workers are separate PHP processes (like Python's multiprocessing).

function is_prime(int $n): bool
{
    if ($n < 2) {
        return false;
    }
    if ($n < 4) {
        return true;
    }
    if ($n % 2 === 0) {
        return false;
    }
    for ($d = 3; $d * $d <= $n; $d += 2) {
        if ($n % $d === 0) {
            return false;
        }
    }
    return true;
}

if (($argv[1] ?? "") === "worker") {
    [, , $n, $workers, $t] = array_map("intval", $argv);
    $count = 0;
    for ($i = $t; $i < $n; $i += $workers) {
        if (is_prime($i)) {
            $count++;
        }
    }
    echo $count;
    exit(0);
}

$n = (int) $argv[1];
$workers = (int) $argv[2];

$procs = [];
for ($t = 0; $t < $workers; $t++) {
    $proc = proc_open(
        [PHP_BINARY, "-d", "memory_limit=-1", __FILE__, "worker", (string) $n, (string) $workers, (string) $t],
        [1 => ["pipe", "w"]],
        $pipes,
    );
    $procs[] = [$proc, $pipes[1]];
}

$total = 0;
foreach ($procs as [$proc, $pipe]) {
    $total += (int) stream_get_contents($pipe);
    fclose($pipe);
    proc_close($proc);
}

echo "primes=$total\n";
