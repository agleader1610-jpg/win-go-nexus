<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ingest.php';

// Protected endpoint: ?key=<SW_INGEST_KEY> or header x-ingest-key.
$key = (string) ($_GET['key'] ?? ($_SERVER['HTTP_X_INGEST_KEY'] ?? ''));
if (!hash_equals(SW_INGEST_KEY, $key)) {
    sw_json(['ok' => false, 'error' => 'unauthorized'], 401);
}

$result = sw_ingest_all();
sw_json(['ok' => true, 'result' => $result, 'fetchedAt' => sw_now_ms()]);
