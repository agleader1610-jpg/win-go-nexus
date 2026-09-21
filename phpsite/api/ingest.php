<?php
declare(strict_types=1);

require dirname(__DIR__) . '/lib/config.php';
require dirname(__DIR__) . '/lib/feed.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$provided = (string) ($_GET['key'] ?? '');
if ($provided === '' || !hash_equals(SW_INGEST_KEY, $provided)) {
    http_response_code(401);
    echo json_encode(['ok'=>false, 'error'=>'Unauthorized']);
    exit;
}

$results = [];
$success = 0;
foreach (sw_games() as $game) {
    $result = sw_sync_game($game);
    $results[] = $result;
    if ($result['ok']) $success++;
}

$allOk = $success === count(sw_games());
http_response_code($success > 0 ? 200 : 503);
echo json_encode([
    'ok'=>$allOk,
    'updated'=>$success,
    'total'=>count(sw_games()),
    'time'=>gmdate('c'),
    'games'=>$results,
], JSON_UNESCAPED_SLASHES);