<?php
// SignalWin — pure PHP build. Cron keeps a persistent JSON reserve on cPanel.
declare(strict_types=1);

const SW_PASSWORD      = 'J4VC-35GY-J4WE';   // লক স্ক্রিন পাসওয়ার্ড
const SW_ROWS          = 20;                  // কতটা ড্র নেওয়া হবে
const SW_RESERVE_ROWS  = 1000;                // cron-এ সর্বোচ্চ কত ড্র রাখা হবে
const SW_INGEST_KEY    = 'vesd2DERKmHyZs9FhaDIuNU_tZFwzXs0CgoNXrPML84';
const SW_TELEGRAM      = 'https://t.me/Eip_trader/24010';
const SW_SUPPORT       = 'https://t.me/teacher_eip';

function sw_games(): array
{
    return [
        ['id'=>'wingo_30s','label'=>'WinGo 30 Second','short'=>'WinGo 30s','kind'=>'wingo','periodSec'=>30,'accent'=>'#ff5c5c','url'=>'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json'],
        ['id'=>'wingo_1m','label'=>'WinGo 1 Minute','short'=>'WinGo 1M','kind'=>'wingo','periodSec'=>60,'accent'=>'#25e39a','url'=>'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json'],
        ['id'=>'wingo_3m','label'=>'WinGo 3 Minute','short'=>'WinGo 3M','kind'=>'wingo','periodSec'=>180,'accent'=>'#22d3ee','url'=>'https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json'],
        ['id'=>'wingo_5m','label'=>'WinGo 5 Minute','short'=>'WinGo 5M','kind'=>'wingo','periodSec'=>300,'accent'=>'#a78bfa','url'=>'https://draw.ar-lottery01.com/WinGo/WinGo_5M/GetHistoryIssuePage.json'],
        ['id'=>'k3_1m','label'=>'K3 Dice 1 Minute','short'=>'K3 1M','kind'=>'k3','periodSec'=>60,'accent'=>'#fbbf24','url'=>'https://draw.ar-lottery01.com/K3/K3_1M/GetHistoryIssuePage.json'],
        ['id'=>'k3_3m','label'=>'K3 Dice 3 Minute','short'=>'K3 3M','kind'=>'k3','periodSec'=>180,'accent'=>'#a3e635','url'=>'https://draw.ar-lottery01.com/K3/K3_3M/GetHistoryIssuePage.json'],
        ['id'=>'k3_5m','label'=>'K3 Dice 5 Minute','short'=>'K3 5M','kind'=>'k3','periodSec'=>300,'accent'=>'#38bdf8','url'=>'https://draw.ar-lottery01.com/K3/K3_5M/GetHistoryIssuePage.json'],
        ['id'=>'k3_10m','label'=>'K3 Dice 10 Minute','short'=>'K3 10M','kind'=>'k3','periodSec'=>600,'accent'=>'#e879f9','url'=>'https://draw.ar-lottery01.com/K3/K3_10M/GetHistoryIssuePage.json'],
        ['id'=>'trx_wingo_1m','label'=>'TrxWinGo 1 Minute','short'=>'Trx WinGo 1M','kind'=>'trx_wingo','periodSec'=>60,'accent'=>'#fb7185','url'=>'https://draw.ar-lottery01.com/TrxWinGo/TrxWinGo_1M/GetHistoryIssuePage.json'],
    ];
}

function sw_game(string $id): ?array
{
    foreach (sw_games() as $g) if ($g['id'] === $id) return $g;
    return null;
}

function sw_categories(): array
{
    return [
        ['id'=>'bs','label'=>'Big / Small','short'=>'B/S','accent'=>'#22d3ee'],
        ['id'=>'color','label'=>'Color','short'=>'Color','accent'=>'#e879f9'],
        ['id'=>'num5','label'=>'5 Numbers','short'=>'5 Nums','accent'=>'#a78bfa'],
        ['id'=>'num7','label'=>'7 Numbers','short'=>'7 Nums','accent'=>'#fbbf24'],
    ];
}

function sw_category(string $id): array
{
    foreach (sw_categories() as $c) if ($c['id'] === $id) return $c;
    return sw_categories()[0];
}

function sw_predictors(): array
{
    return [
        ['id'=>'quantum-x','idx'=>0,'name'=>'Quantum X','tag'=>'Quantum trend hunter','brand'=>'#22d3ee'],
        ['id'=>'apex-titan','idx'=>1,'name'=>'Apex Titan','tag'=>'Pattern dominator','brand'=>'#f59e0b'],
        ['id'=>'cipher-nova','idx'=>2,'name'=>'Cipher Nova','tag'=>'Code breaker','brand'=>'#60a5fa'],
        ['id'=>'vortex-prime','idx'=>3,'name'=>'Vortex Prime','tag'=>'Volatility surgeon','brand'=>'#a855f7'],
        ['id'=>'specter','idx'=>4,'name'=>'Specter','tag'=>'Shadow analyst','brand'=>'#c084fc'],
        ['id'=>'onyx-pulse','idx'=>5,'name'=>'Onyx Pulse','tag'=>'Momentum reader','brand'=>'#10b981'],
        ['id'=>'halo-sigma','idx'=>6,'name'=>'Halo Sigma','tag'=>'Probability scout','brand'=>'#fbbf24'],
        ['id'=>'zenith-ace','idx'=>7,'name'=>'Zenith Ace','tag'=>'Peak strategist','brand'=>'#ef4444'],
        ['id'=>'nyx-oracle','idx'=>8,'name'=>'Nyx Oracle','tag'=>'Cycle whisperer','brand'=>'#818cf8'],
        ['id'=>'phantom-drift','idx'=>9,'name'=>'Phantom Drift','tag'=>'Risk-adjusted seer','brand'=>'#fb923c'],
    ];
}

function sw_predictor(string $id): ?array
{
    foreach (sw_predictors() as $p) if ($p['id'] === $id) return $p;
    return null;
}

/** Base URL of this folder, e.g. /bdwineiplat/ */
function sw_base(): string
{
    $dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
    return $dir === '' ? '/' : $dir . '/';
}

function sw_url(string $path): string
{
    return sw_base() . ltrim($path, '/');
}

function sw_logged_in(): bool
{
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    return !empty($_SESSION['sw_ok']);
}

function sw_require_login(): void
{
    if (sw_logged_in()) return;
    $next = $_SERVER['REQUEST_URI'] ?? sw_url('index.php');
    header('Location: ' . sw_url('login.php') . '?next=' . urlencode($next));
    exit;
}

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}
