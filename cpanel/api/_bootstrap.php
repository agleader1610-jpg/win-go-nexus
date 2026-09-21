<?php
// SignalWin cPanel backend — shared bootstrap (config + SQLite + helpers)
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: content-type, accept, x-ingest-key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------------------------------------------------------------- config
const SW_INGEST_KEY = 'vesd2DERKmHyZs9FhaDIuNU_tZFwzXs0CgoNXrPML84';
const SW_PASSWORD_SHA256 = 'e2641bd77c343c54ad05f82b9eed34a5d54ff7268374786f91d7ab423e77fbe4';
const SW_SESSION_SECRET = '1716b1bc34775add8e5c8062ef3bd0b84a20388fc3f0449d08c71f06cd6f2016';
const SW_SESSION_TTL = 43200;                    // 12 hours
const SW_KEEP_ROWS  = 1200;                      // rows kept per game
const SW_STALE_SEC  = 20;                        // opportunistic re-ingest window

/** Mirror of src/lib/games.config.ts */
function sw_games(): array
{
    return [
        ['id' => 'wingo_30s',    'label' => 'WinGo 30 Second',   'kind' => 'wingo',     'periodSec' => 30,  'upstream' => 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json'],
        ['id' => 'wingo_1m',     'label' => 'WinGo 1 Minute',    'kind' => 'wingo',     'periodSec' => 60,  'upstream' => 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json'],
        ['id' => 'wingo_3m',     'label' => 'WinGo 3 Minute',    'kind' => 'wingo',     'periodSec' => 180, 'upstream' => 'https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json'],
        ['id' => 'wingo_5m',     'label' => 'WinGo 5 Minute',    'kind' => 'wingo',     'periodSec' => 300, 'upstream' => 'https://draw.ar-lottery01.com/WinGo/WinGo_5M/GetHistoryIssuePage.json'],
        ['id' => 'k3_1m',        'label' => 'K3 Dice 1 Minute',  'kind' => 'k3',        'periodSec' => 60,  'upstream' => 'https://draw.ar-lottery01.com/K3/K3_1M/GetHistoryIssuePage.json'],
        ['id' => 'k3_3m',        'label' => 'K3 Dice 3 Minute',  'kind' => 'k3',        'periodSec' => 180, 'upstream' => 'https://draw.ar-lottery01.com/K3/K3_3M/GetHistoryIssuePage.json'],
        ['id' => 'k3_5m',        'label' => 'K3 Dice 5 Minute',  'kind' => 'k3',        'periodSec' => 300, 'upstream' => 'https://draw.ar-lottery01.com/K3/K3_5M/GetHistoryIssuePage.json'],
        ['id' => 'k3_10m',       'label' => 'K3 Dice 10 Minute', 'kind' => 'k3',        'periodSec' => 600, 'upstream' => 'https://draw.ar-lottery01.com/K3/K3_10M/GetHistoryIssuePage.json'],
        ['id' => 'trx_wingo_1m', 'label' => 'TrxWinGo 1 Minute', 'kind' => 'trx_wingo', 'periodSec' => 60,  'upstream' => 'https://draw.ar-lottery01.com/TrxWinGo/TrxWinGo_1M/GetHistoryIssuePage.json'],
    ];
}

function sw_game(string $id): ?array
{
    foreach (sw_games() as $g) {
        if ($g['id'] === $id) return $g;
    }
    return null;
}

// ---------------------------------------------------------------- database
function sw_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dir = __DIR__ . '/../data';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $pdo = new PDO('sqlite:' . $dir . '/signalwin.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA journal_mode=WAL');
    $pdo->exec('PRAGMA busy_timeout=5000');
    $pdo->exec('CREATE TABLE IF NOT EXISTS game_history (
        game_type   TEXT NOT NULL,
        issue_number TEXT NOT NULL,
        number      INTEGER,
        color       TEXT,
        premium     TEXT,
        sum         INTEGER,
        block_hash  TEXT,
        recorded_at INTEGER NOT NULL,
        PRIMARY KEY (game_type, issue_number)
    )');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_gh_game_issue ON game_history (game_type, issue_number DESC)');
    return $pdo;
}

function sw_json($payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function sw_b64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function sw_b64url_decode(string $value): string|false
{
    $value = strtr($value, '-_', '+/');
    $padding = strlen($value) % 4;
    if ($padding) $value .= str_repeat('=', 4 - $padding);
    return base64_decode($value, true);
}

function sw_session_create(): array
{
    $expires = time() + SW_SESSION_TTL;
    $payload = sw_b64url_encode(json_encode([
        'exp' => $expires,
        'v' => substr(SW_PASSWORD_SHA256, 0, 16),
    ], JSON_UNESCAPED_SLASHES));
    $signature = sw_b64url_encode(hash_hmac('sha256', $payload, SW_SESSION_SECRET, true));
    return ['token' => $payload . '.' . $signature, 'expiresAt' => gmdate('c', $expires)];
}

function sw_session_valid(string $token): bool
{
    $parts = explode('.', $token);
    if (count($parts) !== 2) return false;
    [$payload, $signature] = $parts;
    $expected = sw_b64url_encode(hash_hmac('sha256', $payload, SW_SESSION_SECRET, true));
    if (!hash_equals($expected, $signature)) return false;
    $decoded = sw_b64url_decode($payload);
    if ($decoded === false) return false;
    $data = json_decode($decoded, true);
    return is_array($data)
        && isset($data['exp'], $data['v'])
        && (int) $data['exp'] > time()
        && hash_equals(substr(SW_PASSWORD_SHA256, 0, 16), (string) $data['v']);
}

// ---------------------------------------------------------------- reads
function sw_read_recent(string $gameId, int $limit = 60): array
{
    $st = sw_db()->prepare(
        'SELECT game_type, issue_number, number, color, premium, sum, block_hash
           FROM game_history WHERE game_type = :g
          ORDER BY LENGTH(issue_number) DESC, issue_number DESC LIMIT :l'
    );
    $st->bindValue(':g', $gameId);
    $st->bindValue(':l', $limit, PDO::PARAM_INT);
    $st->execute();
    return $st->fetchAll();
}

function sw_to_api_shape(string $gameId, array $rows): array
{
    $cfg = sw_game($gameId);
    $list = [];
    foreach ($rows as $r) {
        $list[] = [
            'issueNumber' => (string) $r['issue_number'],
            'number'      => $r['number'] !== null ? (string) $r['number'] : '',
            'color'       => (string) ($r['color'] ?? ''),
            'premium'     => (string) ($r['premium'] ?? ''),
            'sum'         => (int) ($r['sum'] ?? 0),
            'blockHash'   => (string) ($r['block_hash'] ?? ''),
        ];
    }
    return [
        'game' => $cfg
            ? ['id' => $cfg['id'], 'label' => $cfg['label'], 'kind' => $cfg['kind'], 'periodSec' => $cfg['periodSec']]
            : ['id' => $gameId],
        'list' => $list,
        'count' => count($list),
        'serviceTime' => sw_now_ms(),
    ];
}

function sw_now_ms(): int
{
    return (int) round(microtime(true) * 1000);
}

/** Big decimal string +1 (issue numbers exceed 64-bit). */
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
