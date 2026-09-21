<?php
// Live feed: fetches the upstream lottery API directly (no database).
// A tiny file cache (few seconds) keeps repeated page loads fast.
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function sw_cache_dir(): string
{
    $dir = sys_get_temp_dir() . '/sw-feed';
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    return $dir;
}

function sw_http_get(string $url, int $timeout = 6): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_CONNECTTIMEOUT => 4,
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

/** Normalised draw rows, newest first. */
function sw_draws(string $gameId, int $ttl = 5): array
{
    $cfg = sw_game($gameId);
    if (!$cfg) return [];
    $file = sw_cache_dir() . '/' . $gameId . '.json';

    if (is_file($file) && (time() - (int) @filemtime($file)) < $ttl) {
        $cached = json_decode((string) @file_get_contents($file), true);
        if (is_array($cached) && $cached) return $cached;
    }

    $raw = sw_http_get($cfg['url']);
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

    if ($rows) {
        @file_put_contents($file, json_encode($rows, JSON_UNESCAPED_SLASHES), LOCK_EX);
        return array_slice($rows, 0, SW_ROWS);
    }

    // Upstream failed → serve the last good snapshot instead of an empty page.
    if (is_file($file)) {
        $cached = json_decode((string) @file_get_contents($file), true);
        if (is_array($cached)) return array_slice($cached, 0, SW_ROWS);
    }
    return [];
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
