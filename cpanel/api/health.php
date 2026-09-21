<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$counts = [];
foreach (sw_games() as $g) {
    $st = sw_db()->prepare('SELECT COUNT(*) c, MAX(recorded_at) t FROM game_history WHERE game_type = :g');
    $st->execute([':g' => $g['id']]);
    $row = $st->fetch() ?: ['c' => 0, 't' => null];
    $counts[$g['id']] = ['rows' => (int) $row['c'], 'lastIngest' => $row['t'] !== null ? (int) $row['t'] : null];
}

sw_json([
    'ok' => true,
    'php' => PHP_VERSION,
    'pdo_sqlite' => in_array('sqlite', PDO::getAvailableDrivers(), true),
    'curl' => function_exists('curl_init'),
    'games' => $counts,
    'now' => time(),
]);
