<?php
// PHP has no threads in the CLI build, so the workers are separate PHP processes (like Python's multiprocessing):
// this file is started again with `worker`, the harness only includes it.

function lb_is_prime(int $n): bool
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

if (isset($argv[1], $argv[0]) && $argv[1] === "worker" && realpath($argv[0]) === __FILE__) {
    [, , $n, $workers, $t] = array_map("intval", $argv);
    $count = 0;
    for ($i = $t; $i < $n; $i += $workers) {
        if (lb_is_prime($i)) {
            $count++;
        }
    }
    echo $count;
    exit(0);
}

final class Problem
{
    private static int $n = 2000000;
    private static int $workers = 4;

    public static function setup(array $args): void
    {
        if (count($args) > 1) {
            self::$n = (int) $args[0];
            self::$workers = (int) $args[1];
        }
    }

    public static function decode(string $data)
    {
        return null;
    }

    public static function solve($_)
    {
        $procs = [];
        for ($t = 0; $t < self::$workers; $t++) {
            $proc = proc_open(
                [PHP_BINARY, "-d", "memory_limit=-1", __FILE__, "worker", (string) self::$n, (string) self::$workers, (string) $t],
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
        return [$total];
    }

    public static function emit($r): array
    {
        return $r;
    }
}
