<?php
// Upstream ingest -> SQLite (replacement for the old edge ingest function).
declare(strict_types=1);

function sw_http_get(string $url, int $timeout = 12): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => 6,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 SignalWinBot',
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body === false || $code < 200 || $code >= 300) return null;
        return (string) $body;
    }
    $ctx = stream_context_create(['http' => [
        'timeout' => $timeout,
        'header' => "User-Agent: Mozilla/5.0 SignalWinBot\r\nAccept: application/json\r\n",
    ]]);
    $body = @file_get_contents($url, false, $ctx);
    return $body === false ? null : $body;
}

function sw_ingest_game(array $cfg): int
{
    $url = $cfg['upstream'] . '?ts=' . sw_now_ms();
    $body = sw_http_get($url);
    if ($body === null) return 0;
    $json = json_decode($body, true);
    $list = $json['data']['list'] ?? [];
    if (!is_array($list) || !count($list)) return 0;

    $db = sw_db();
    $st = $db->prepare(
        'INSERT OR IGNORE INTO game_history
            (game_type, issue_number, number, color, premium, sum, block_hash, recorded_at)
         VALUES (:g, :i, :n, :c, :p, :s, :b, :t)'
    );
    $now = time();
    $db->beginTransaction();
    $n = 0;
    foreach ($list as $it) {
        if (!is_array($it) || empty($it['issueNumber'])) continue;
        $numRaw = $it['number'] ?? '';
        $num = ($numRaw === '' || $numRaw === null) ? null : (int) $numRaw;
        $st->execute([
            ':g' => $cfg['id'],
            ':i' => (string) $it['issueNumber'],
            ':n' => $num,
            ':c' => isset($it['color']) ? (string) $it['color'] : null,
            ':p' => isset($it['premium']) ? (string) $it['premium'] : null,
            ':s' => isset($it['sum']) ? (int) $it['sum'] : null,
            ':b' => isset($it['blockId']) ? (string) $it['blockId'] : null,
            ':t' => $now,
        ]);
        $n++;
    }
    $db->commit();
    sw_trim_game($cfg['id']);
    return $n;
}

function sw_trim_game(string $gameId): void
{
    $db = sw_db();
    $st = $db->prepare(
        'DELETE FROM game_history
          WHERE game_type = :g AND issue_number NOT IN (
              SELECT issue_number FROM game_history WHERE game_type = :g2
               ORDER BY LENGTH(issue_number) DESC, issue_number DESC LIMIT :k
          )'
    );
    $st->bindValue(':g', $gameId);
    $st->bindValue(':g2', $gameId);
    $st->bindValue(':k', SW_KEEP_ROWS, PDO::PARAM_INT);
    $st->execute();
}

function sw_ingest_all(): array
{
    $out = [];
    foreach (sw_games() as $g) {
        try {
            $out[$g['id']] = sw_ingest_game($g);
        } catch (Throwable $e) {
            $out[$g['id']] = 'error: ' . $e->getMessage();
        }
    }
    return $out;
}

/**
 * Keeps data live without cron: at most one upstream pull per game per
 * SW_STALE_SEC, guarded by a lock file so concurrent visitors don't stampede.
 */
function sw_refresh_if_stale(array $cfg): void
{
    $dir = sys_get_temp_dir();
    $lock = $dir . '/sw_ing_' . preg_replace('/\W/', '', $cfg['id']) . '.lock';
    $last = is_file($lock) ? (int) @filemtime($lock) : 0;
    if (time() - $last < SW_STALE_SEC) return;
    @touch($lock);
    $fp = @fopen($lock, 'c');
    if (!$fp) return;
    if (!flock($fp, LOCK_EX | LOCK_NB)) { fclose($fp); return; }
    try {
        sw_ingest_game($cfg);
    } catch (Throwable $e) {
        // ignore — stale data is still served
    }
    flock($fp, LOCK_UN);
    fclose($fp);
}
