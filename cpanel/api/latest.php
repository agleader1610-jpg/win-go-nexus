<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$latest = [];
foreach (sw_games() as $g) {
    try {
        $rows = sw_read_recent($g['id'], 1);
        $row = $rows[0] ?? null;
        $cur = $row ? (string) $row['issue_number'] : '';
        $latest[] = [
            'id' => $g['id'],
            'currentIssue' => $cur,
            'nextIssue' => $cur !== '' ? sw_inc_str($cur) : '',
            'lastNumber' => $row && $row['number'] !== null ? (int) $row['number'] : null,
            'lastSum' => $row && $row['sum'] !== null ? (int) $row['sum'] : null,
            'lastColor' => $row ? ($row['color'] ?? null) : null,
        ];
    } catch (Throwable $e) {
        $latest[] = ['id' => $g['id'], 'currentIssue' => '', 'nextIssue' => '', 'lastNumber' => null, 'lastSum' => null, 'lastColor' => null];
    }
}

sw_json(['ok' => true, 'latest' => $latest, 'fetchedAt' => sw_now_ms()]);
