<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

function sw_head(string $title, string $desc, int $periodSec = 0): void
{
    $base = sw_base();
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>' . e($title) . '</title>';
    echo '<meta name="description" content="' . e($desc) . '">';
    echo '<meta property="og:type" content="website">';
    echo '<meta name="twitter:card" content="summary">';
    echo '<meta property="og:title" content="' . e($title) . '">';
    echo '<meta property="og:description" content="' . e($desc) . '">';
    echo '<link rel="icon" href="' . e($base) . 'favicon.ico">';
    echo '<link rel="stylesheet" href="' . e($base) . 'assets/app.css">';
    echo '</head><body data-period-sec="' . $periodSec . '">';
}

function sw_brand(): void
{
    echo '<a class="brand" href="' . e(sw_url('index.php')) . '"><span class="dot">S</span>'
       . '<span>Signal<span class="b">Win</span></span></a>';
}

function sw_notice(): void
{
    ?>
    <div class="backdrop" id="sw-notice">
      <div class="card notice">
        <div class="eyebrow" style="color:var(--amber)">Official Notice</div>
        <h2>সতর্কতা — কেউ টাকা চাইলে দিবেন না</h2>
        <p>আমাদের হ্যাক/প্রেডিকশন অন্য কারও কাছ থেকে <b>কিনবেন না</b>। আমরা সম্পূর্ণ <b>ফ্রিতে</b> দিয়ে থাকি, তাই কেউ টাকা চাইলে সেটা scam।</p>
        <p>কোনো সমস্যা হলে যোগাযোগ করুন: <a href="<?= e(SW_SUPPORT) ?>" target="_blank" rel="noopener" style="color:var(--primary)"><?= e(SW_SUPPORT) ?></a></p>
        <p>হ্যাক ও অন্যান্য সকল বিষয়ের প্রেডিকশন পেতে আমাদের চ্যানেলে যুক্ত হন।</p>
        <a class="btn" style="text-align:center;margin-top:12px" href="<?= e(SW_TELEGRAM) ?>" target="_blank" rel="noopener">Join Telegram Channel</a>
        <button class="btn ghost" style="margin-top:8px" data-close>বুঝেছি, বন্ধ করুন</button>
      </div>
    </div>
    <?php
}

function sw_foot(string $line = 'SignalWin · AI Signal Desk · v3.0'): void
{
    echo '<div class="foot">' . e($line) . '</div>';
    echo '<script src="' . e(sw_base()) . 'assets/app.js"></script></body></html>';
}

function sw_icon_for(string $kind): string
{
    return $kind === 'k3' ? '🎲' : ($kind === 'trx_wingo' ? '⛓️' : '🎯');
}

function sw_period_label(int $sec): string
{
    return $sec >= 60 ? intdiv($sec, 60) . 'M' : $sec . 'S';
}

function sw_kind_label(string $kind): string
{
    return $kind === 'k3' ? 'Dice prediction' : ($kind === 'trx_wingo' ? 'Blockchain prediction' : 'Color prediction');
}

function sw_color_hex(?string $c): string
{
    return $c === 'red' ? '#ff5c5c' : ($c === 'green' ? '#25e39a' : '#8b5cf6');
}
