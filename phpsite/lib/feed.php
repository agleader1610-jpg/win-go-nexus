<?php
// Persistent JSON feed. Public pages only read the local reserve, so an
// unavailable upstream can never hold a page open. Cron refreshes the files.
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function sw_cache_dir(): string
{
    $dir = dirname(__DIR__) . '/data';
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    return $dir;
}

function sw_http_get(string $url, int $timeout = 4): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Mozilla/5.0 SignalWin/1.0',
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if (is_string($body) && $body !== '' && $code >= 200 && $code < 400) return $body;
        return null;
    }
    $ctx = stream_context_create(['http' => ['timeout' => $timeout, 'header' => "Accept: application/json\r\n"]]);
    $body = @file_get_contents($url, false, $ctx);
    return is_string($body) && $body !== '' ? $body : null;
}

function sw_normalise_feed(?string $raw): array
{
    $rows = [];
    if ($raw !== null) {
        $json = json_decode($raw, true);
        $list = $json['data']['list'] ?? ($json['list'] ?? []);
        if (is_array($list)) {
            foreach ($list as $r) {
                $issue = (string) ($r['issueNumber'] ?? $r['issue'] ?? '');
                if ($issue === '') continue;
                $rows[] = [
                    'issueNumber' => $issue,
                    'number'      => (string) ($r['number'] ?? ''),
                    'color'       => (string) ($r['colour'] ?? $r['color'] ?? ''),
                    'sum'         => isset($r['sum']) ? (int) $r['sum'] : null,
                    'premium'     => (string) ($r['premium'] ?? ''),
                ];
            }
        }
    }

    return $rows;
}

function sw_read_reserve(string $gameId, int $limit = SW_ROWS): array
{
    $file = sw_cache_dir() . '/' . $gameId . '.json';
    if (is_file($file)) {
        $cached = json_decode((string) @file_get_contents($file), true);
        if (is_array($cached)) return array_slice($cached, 0, $limit);
    }
    return [];
}

function sw_store_reserve(string $gameId, array $incoming): array
{
    $merged = [];
    foreach (array_merge($incoming, sw_read_reserve($gameId, SW_RESERVE_ROWS)) as $row) {
        $issue = (string) ($row['issueNumber'] ?? '');
        if ($issue !== '' && !isset($merged[$issue])) $merged[$issue] = $row;
    }
    krsort($merged, SORT_STRING);
    $rows = array_slice(array_values($merged), 0, SW_RESERVE_ROWS);
    $file = sw_cache_dir() . '/' . $gameId . '.json';
    $tmp = $file . '.tmp';
    if (@file_put_contents($tmp, json_encode($rows, JSON_UNESCAPED_SLASHES), LOCK_EX) !== false) {
        @rename($tmp, $file);
    }
    return $rows;
}

/** Public pages never contact upstream; they read the last cron snapshot. */
function sw_draws(string $gameId, int $ttl = 0): array
{
    return sw_read_reserve($gameId, SW_ROWS);
}

/** Fetch and reserve one game. Existing data remains untouched on failure. */
function sw_sync_game(array $cfg): array
{
    $url = $cfg['url'] . (str_contains($cfg['url'], '?') ? '&' : '?') . 'ts=' . (string) round(microtime(true) * 1000);
    $incoming = sw_normalise_feed(sw_http_get($url));
    if (!$incoming) {
        return ['id'=>$cfg['id'], 'ok'=>false, 'fetched'=>0, 'reserved'=>count(sw_read_reserve($cfg['id'], SW_RESERVE_ROWS))];
    }
    $saved = sw_store_reserve($cfg['id'], $incoming);
    return ['id'=>$cfg['id'], 'ok'=>true, 'fetched'=>count($incoming), 'reserved'=>count($saved), 'latest'=>$saved[0]['issueNumber'] ?? null];
}

/** Big-number string +1 (issue numbers exceed 64-bit). */
function sw_inc_str(string $n): string
{
    $n = preg_replace('/\D/', '', $n) ?? '';
    if ($n === '') return '';
    $i = strlen($n) - 1;
    $carry = 1;
    $out = $n;
    while ($i >= 0 && $carry) {
        $d = (int) $out[$i] + $carry;
        $out[$i] = (string) ($d % 10);
        $carry = intdiv($d, 10);
        $i--;
    }
    return $carry ? '1' . $out : $out;
}
