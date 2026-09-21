<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$history = [];
foreach (sw_games() as $g) {
    try {
        $rows = sw_read_recent($g['id'], 1000);
        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                'issueNumber' => (string) $r['issue_number'],
                'number' => $r['number'] !== null ? (string) $r['number'] : '0',
                'color' => (string) ($r['color'] ?? ''),
                'sum' => (int) ($r['sum'] ?? 0),
            ];
        }
        $history[$g['id']] = $out;
    } catch (Throwable $e) {
        $history[$g['id']] = [];
    }
}

sw_json(['ok' => true, 'history' => $history, 'fetchedAt' => sw_now_ms()]);
