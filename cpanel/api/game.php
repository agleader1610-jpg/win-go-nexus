<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_signals.php';
require __DIR__ . '/_ingest.php';

$gameId = isset($_GET['game']) ? (string) $_GET['game'] : '';
$cfg = sw_game($gameId);
if (!$cfg) sw_json(['ok' => false, 'error' => 'Unknown game', 'signals' => new stdClass()], 400);

try {
    sw_refresh_if_stale($cfg);
    $rows = sw_read_recent($gameId, 60);
    if (!count($rows)) {
        sw_ingest_game($cfg);
        $rows = sw_read_recent($gameId, 60);
    }
    $signals = sw_build_signals($gameId, $rows);
    sw_json([
        'ok' => true,
        'data' => sw_to_api_shape($gameId, $rows),
        'signals' => count($signals) ? $signals : new stdClass(),
        'fetchedAt' => sw_now_ms(),
    ]);
} catch (Throwable $e) {
    sw_json(['ok' => false, 'error' => $e->getMessage(), 'signals' => new stdClass()], 500);
}
