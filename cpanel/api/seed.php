<?php
// One-shot bulk history seed (protected by the ingest key).
// POST JSON: {"key":"...","rows":[{"game_type":"wingo_30s","issue_number":"...","number":6,"color":"red","premium":"6","sum":0,"block_hash":null}]}
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ingest.php';

$raw = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);
if (!is_array($body) || ($body['key'] ?? '') !== SW_INGEST_KEY) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'bad key']);
    exit;
}
$rows = $body['rows'] ?? [];
if (!is_array($rows)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'rows must be an array']);
    exit;
}

$db = sw_db();
$st = $db->prepare(
    'INSERT OR IGNORE INTO game_history
        (game_type, issue_number, number, color, premium, sum, block_hash, recorded_at)
     VALUES (:g, :i, :n, :c, :p, :s, :b, :t)'
);
$now = time();
$inserted = 0;
$db->beginTransaction();
foreach ($rows as $it) {
    if (!is_array($it) || empty($it['game_type']) || empty($it['issue_number'])) continue;
    $numRaw = $it['number'] ?? null;
    $st->execute([
        ':g' => (string) $it['game_type'],
        ':i' => (string) $it['issue_number'],
        ':n' => $numRaw === null || $numRaw === '' ? null : (int) $numRaw,
        ':c' => isset($it['color']) ? (string) $it['color'] : null,
        ':p' => isset($it['premium']) ? (string) $it['premium'] : null,
        ':s' => isset($it['sum']) ? (int) $it['sum'] : null,
        ':b' => isset($it['block_hash']) ? (string) $it['block_hash'] : null,
        ':t' => $now,
    ]);
    $inserted += $st->rowCount();
}
$db->commit();
foreach (array_unique(array_column($rows, 'game_type')) as $g) {
    if (is_string($g)) sw_trim_game($g);
}
echo json_encode(['ok' => true, 'received' => count($rows), 'inserted' => $inserted]);
