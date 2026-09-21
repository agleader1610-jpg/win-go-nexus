<?php
// Deterministic signal engine — 1:1 PHP port of the original TS logic
// (FNV-1a hash + mulberry32 PRNG, 32-bit arithmetic preserved).
declare(strict_types=1);

function sw_imul(int $a, int $b): int
{
    $a &= 0xFFFFFFFF;
    $b &= 0xFFFFFFFF;
    $ah = ($a >> 16) & 0xFFFF;
    $al = $a & 0xFFFF;
    $hi = ($ah * $b) & 0xFFFF;
    return ((($hi << 16) & 0xFFFFFFFF) + ($al * $b)) & 0xFFFFFFFF;
}

function sw_hash_str(string $s): int
{
    $h = 2166136261 & 0xFFFFFFFF;
    $len = strlen($s);
    for ($i = 0; $i < $len; $i++) {
        $h = ($h ^ ord($s[$i])) & 0xFFFFFFFF;
        $h = sw_imul($h, 16777619);
    }
    return $h & 0xFFFFFFFF;
}

/** Returns a stateful closure producing floats in [0,1). */
function sw_mulberry32(int $seed): callable
{
    $t = $seed & 0xFFFFFFFF;
    return function () use (&$t): float {
        $t = ($t + 0x6D2B79F5) & 0xFFFFFFFF;
        $r = $t;
        $r = sw_imul($r ^ (($r >> 15) & 0x1FFFF), $r | 1);
        $r = ($r ^ (($r + sw_imul($r ^ (($r >> 7) & 0x1FFFFFF), $r | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF;
        return (float) (($r ^ (($r >> 14) & 0x3FFFF)) & 0xFFFFFFFF) / 4294967296.0;
    };
}

function sw_build_signal_for_period(string $gameId, string $kind, string $period, array $history): array
{
    $rand = sw_mulberry32(sw_hash_str($gameId . '::v1:' . $period));
    $r = function (int $min, int $max) use ($rand): int {
        return (int) round($min + $rand() * ($max - $min));
    };
    $recent = array_slice($history, 0, 10);
    $now = sw_now_ms();

    if ($kind === 'k3') {
        $big = 0;
        foreach ($recent as $h) {
            if ((int) ($h['sum'] ?? 0) >= 11) $big++;
        }
        $bias = count($recent) ? $big / count($recent) : 0.5;
        $score = $rand() + (0.5 - $bias) * 0.4;
        $type = $score > 0.5 ? 'BIG' : 'SMALL';
        $dice = [$r(1, 6), $r(1, 6), $r(1, 6)];
        return [
            'period' => $period,
            'type' => $type,
            'prediction' => $type,
            'confidence' => $r(55, 92),
            'trendPower' => $r(40, 96),
            'volatility' => $r(20, 90),
            'marketHeat' => $r(35, 98),
            'generatedAt' => $now,
            'diceGuess' => $dice,
        ];
    }

    $big = 0;
    foreach ($recent as $h) {
        if ((int) ($h['number'] ?? 0) >= 5) $big++;
    }
    $bias = count($recent) ? $big / count($recent) : 0.5;
    $score = $rand() + (0.5 - $bias) * 0.4;
    $type = $score > 0.5 ? 'BIG' : 'SMALL';
    return [
        'period' => $period,
        'type' => $type,
        'prediction' => $type,
        'confidence' => $r(52, 94),
        'trendPower' => $r(40, 98),
        'volatility' => $r(20, 95),
        'marketHeat' => $r(30, 99),
        'generatedAt' => $now,
    ];
}

function sw_build_signals(string $gameId, array $rows): array
{
    $cfg = sw_game($gameId);
    if (!$cfg) return [];
    $out = [];
    if (!empty($rows[0]['issue_number'])) {
        $next = sw_inc_str((string) $rows[0]['issue_number']);
        if ($next !== '') {
            $out[$next] = sw_build_signal_for_period($gameId, $cfg['kind'], $next, $rows);
        }
    }
    $slice = array_slice($rows, 0, 60);
    foreach ($slice as $idx => $row) {
        $issue = (string) $row['issue_number'];
        $out[$issue] = sw_build_signal_for_period(
            $gameId,
            $cfg['kind'],
            $issue,
            array_slice($rows, $idx + 1)
        );
    }
    return $out;
}
