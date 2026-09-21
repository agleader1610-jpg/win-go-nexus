<?php
// Signal logic — Trader N copies the N-th previous draw (shift-N) for B/S & Color.
// 5 Nums / 7 Nums use a deterministic seeded plan.
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function sw_side(int $n, string $kind, ?int $sum): string
{
    if ($kind === 'k3') return ($sum ?? 0) >= 11 ? 'Big' : 'Small';
    return $n >= 5 ? 'Big' : 'Small';
}

function sw_color_of(int $n): string
{
    return $n % 2 === 0 ? 'red' : 'green';
}

function sw_actual_color(?string $raw): ?string
{
    $s = strtolower((string) $raw);
    if (str_contains($s, 'red')) return 'red';
    if (str_contains($s, 'green')) return 'green';
    return null;
}

function sw_seed(string $s): int
{
    return (int) (crc32($s) & 0x7FFFFFFF);
}

/** Deterministic number plan (5 or 7 digits) for a given period. */
function sw_num_plan(string $gameId, string $cat, string $predictorId, string $period): array
{
    $target = $cat === 'num5' ? 5 : 7;
    mt_srand(sw_seed("numplan|$gameId|$cat|$predictorId|$period"));
    $pool = range(0, 9);
    for ($i = 9; $i > 0; $i--) {
        $j = mt_rand(0, $i);
        [$pool[$i], $pool[$j]] = [$pool[$j], $pool[$i]];
    }
    mt_srand();
    $nums = array_slice($pool, 0, $target);
    sort($nums);
    return $nums;
}

/**
 * Full trader state for one category.
 * Returns pending signal, recent result rows, wins/losses and loss streak.
 */
function sw_trader_state(array $history, string $cat, int $traderIdx, string $nextPeriod, string $gameId, string $kind, string $predictorId): array
{
    $empty = ['pending'=>null,'rows'=>[],'wins'=>0,'losses'=>0,'streak'=>0,'restricted'=>false];
    if (!$history) return $empty;
    $N = $traderIdx + 1;

    // ---- pending signal for the upcoming period
    $pending = null;
    if ($cat === 'bs' || $cat === 'color') {
        $src = $history[$traderIdx] ?? null;
        if ($src && $nextPeriod !== '') {
            $num = (int) ($src['number'] !== '' ? $src['number'] : 0);
            $pending = [
                'period'     => $nextPeriod,
                'display'    => $cat === 'bs' ? sw_side($num, $kind, $src['sum'] ?? null) : sw_color_of($num),
                'confidence' => 80 + (abs($num) % 15),
                'source'     => $src['issueNumber'],
            ];
        }
    } else {
        $nums = sw_num_plan($gameId, $cat, $predictorId, $nextPeriod !== '' ? $nextPeriod : $predictorId);
        $pending = [
            'period'     => $nextPeriod,
            'display'    => implode(',', $nums),
            'confidence' => 80 + (($traderIdx * 7) % 15),
            'source'     => null,
        ];
    }

    // ---- past results
    $rows = [];
    $maxI = count($history) - $N - 1;
    for ($i = 0; $i <= $maxI && count($rows) < 10; $i++) {
        $actual = $history[$i];
        $aNum = (int) ($actual['number'] !== '' ? $actual['number'] : 0);
        $aSide = sw_side($aNum, $kind, $actual['sum'] ?? null);
        $aColor = sw_actual_color($actual['color'] ?? null);

        if ($cat === 'bs' || $cat === 'color') {
            $src = $history[$i + $N] ?? null;
            if (!$src) continue;
            $sNum = (int) ($src['number'] !== '' ? $src['number'] : 0);
            $pred = $cat === 'bs' ? sw_side($sNum, $kind, $src['sum'] ?? null) : sw_color_of($sNum);
            $win = $cat === 'bs' ? ($pred === $aSide) : ($aColor !== null && $pred === $aColor);
            $rows[] = [
                'period'=>$actual['issueNumber'],'prediction'=>$pred,'actualNumber'=>$aNum,
                'actualSide'=>$aSide,'actualColor'=>$aColor,
                'confidence'=>80 + (abs($sNum) % 15),'result'=>$win ? 'WIN' : 'LOSS',
            ];
        } else {
            $nums = sw_num_plan($gameId, $cat, $predictorId, $actual['issueNumber']);
            $win = in_array($aNum, $nums, true);
            $rows[] = [
                'period'=>$actual['issueNumber'],'prediction'=>implode(',', $nums),'actualNumber'=>$aNum,
                'actualSide'=>$aSide,'actualColor'=>$aColor,
                'confidence'=>80 + (($traderIdx * 7 + $i) % 15),'result'=>$win ? 'WIN' : 'LOSS',
            ];
        }
    }

    $wins = 0; $losses = 0; $streak = 0; $still = true;
    foreach ($rows as $r) {
        if ($r['result'] === 'WIN') { $wins++; $still = false; }
        else { $losses++; if ($still) $streak++; }
    }
    $restricted = $streak >= 7 || (count($rows) >= 5 && $wins <= 2);

    return compact('pending', 'rows', 'wins', 'losses', 'streak', 'restricted');
}

function sw_hit_rate(array $state, int $idx): int
{
    $total = $state['wins'] + $state['losses'];
    if ($total === 0) return 75 + (($idx * 3) % 20);
    return (int) round($state['wins'] / $total * 100);
}

/** Ranked, visible traders (restricted / 7+ loss streak hidden). */
function sw_ranked(array $history, string $cat, string $nextPeriod, string $gameId, string $kind): array
{
    $out = [];
    foreach (sw_predictors() as $p) {
        $state = sw_trader_state($history, $cat, $p['idx'], $nextPeriod, $gameId, $kind, $p['id']);
        if ($state['restricted'] || $state['streak'] >= 7) continue;
        $out[] = ['p' => $p, 's' => $state];
    }
    usort($out, function ($a, $b) {
        if ($b['s']['wins'] !== $a['s']['wins']) return $b['s']['wins'] <=> $a['s']['wins'];
        return $a['s']['losses'] <=> $b['s']['losses'];
    });
    return $out;
}
