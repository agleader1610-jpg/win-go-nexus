<?php
declare(strict_types=1);
require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/feed.php';
require __DIR__ . '/lib/logic.php';
require __DIR__ . '/lib/layout.php';

sw_require_login();

$cfg = sw_game((string) ($_GET['game'] ?? ''));
$p   = sw_predictor((string) ($_GET['trader'] ?? ''));
if (!$cfg || !$p) { header('Location: ' . sw_url('index.php')); exit; }
$cat = sw_category((string) ($_GET['cat'] ?? 'bs'));

$rows  = sw_draws($cfg['id']);
$next  = $rows ? sw_inc_str((string) $rows[0]['issueNumber']) : '';
$s     = sw_trader_state($rows, $cat['id'], $p['idx'], $next, $cfg['id'], $cfg['kind'], $p['id']);
$disp  = $s['pending']['display'] ?? '—';
$isColor = $cat['id'] === 'color';
$col = $isColor ? sw_color_hex($disp) : ($disp === 'Big' ? '#25e39a' : ($disp === 'Small' ? '#ff5c5c' : $cat['accent']));

sw_head($p['name'] . ' · ' . $cfg['label'] . ' — SignalWin', $p['name'] . ' live ' . $cat['label'] . ' signal for ' . $cfg['label'] . '.', $cfg['periodSec']);
?>
<div class="wrap">
  <div class="topbar">
    <a class="iconbtn" href="<?= e(sw_url('game.php')) ?>?game=<?= e($cfg['id']) ?>&amp;cat=<?= e($cat['id']) ?>" aria-label="Back">←</a>
    <?php sw_brand(); ?>
    <a class="iconbtn" href="<?= e(sw_url('logout.php')) ?>" aria-label="Lock">⎋</a>
  </div>

  <div class="card gamehead">
    <span class="glow" style="background:<?= e($p['brand']) ?>"></span>
    <span class="mono-logo" style="width:50px;height:50px;background:linear-gradient(140deg,<?= e($p['brand']) ?>,<?= e($p['brand']) ?>88)"><?= e(strtoupper(substr($p['name'], 0, 2))) ?></span>
    <span class="grow">
      <h1 class="trunc" style="margin:0;font-size:16px;font-weight:900"><?= e($p['name']) ?></h1>
      <span class="sub trunc"><?= e($p['tag']) ?> · <?= e($cfg['short']) ?> · <?= e($cat['label']) ?></span>
    </span>
    <span class="numbox" style="border-color:rgba(34,211,238,.35);background:rgba(34,211,238,.12);color:var(--primary)" id="sw-countdown">··</span>
  </div>

  <div class="card hero" style="border-color:<?= e($col) ?>59;background:linear-gradient(160deg,<?= e($col) ?>1a,var(--card-2))">
    <span class="glow" style="background:<?= e($col) ?>"></span>
    <div class="eyebrow">Next Signal · #<?= e($next !== '' ? substr($next, -10) : '————') ?></div>
    <div class="big" style="color:<?= e($col) ?>;text-transform:<?= $isColor ? 'capitalize' : 'none' ?>"><?= e(strtoupper((string) $disp)) ?></div>
    <div class="eyebrow">Confidence <?= (int) ($s['pending']['confidence'] ?? 0) ?>%</div>
    <a class="btn" style="margin-top:14px;text-align:center" href="<?= e(SW_TELEGRAM) ?>" target="_blank" rel="noopener">Bet · Telegram Channel</a>
  </div>

  <div class="stats">
    <div class="card stat"><div class="v" style="color:var(--primary)"><?= sw_hit_rate($s, $p['idx']) ?>%</div><div class="k">Hit rate</div></div>
    <div class="card stat"><div class="v" style="color:var(--green)"><?= (int) $s['wins'] ?></div><div class="k">Wins</div></div>
    <div class="card stat"><div class="v" style="color:var(--red)"><?= (int) $s['losses'] ?></div><div class="k">Losses</div></div>
  </div>

  <div class="sec"><span style="color:var(--primary)">▤</span><h2>Past Performance</h2><span class="line"></span></div>

  <div class="card" style="padding:4px 2px">
    <table class="hist">
      <thead><tr><th>Period</th><th>Signal</th><th>Result</th><th style="text-align:right">Draw</th></tr></thead>
      <tbody>
      <?php if (!$s['rows']): ?>
        <tr><td colspan="4" style="text-align:center;color:var(--fg-dim);padding:16px">ডাটা সিঙ্ক হচ্ছে…</td></tr>
      <?php endif; ?>
      <?php foreach ($s['rows'] as $r): ?>
        <tr>
          <td style="color:var(--fg-dim)">#<?= e(substr((string) $r['period'], -6)) ?></td>
          <td style="text-transform:<?= $isColor ? 'capitalize' : 'none' ?>"><?= e((string) $r['prediction']) ?></td>
          <td><span class="badge <?= $r['result'] === 'WIN' ? 'win' : 'loss' ?>"><?= e($r['result']) ?></span></td>
          <td style="text-align:right">
            <b><?= (int) $r['actualNumber'] ?></b>
            <span style="color:<?= e(sw_color_hex($r['actualColor'])) ?>">●</span>
            <span style="color:var(--fg-dim)"><?= e((string) $r['actualSide']) ?></span>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <div class="card" style="margin-top:12px;padding:12px">
    <div class="eyebrow">Strategy</div>
    <p class="muted" style="font-size:12.5px;line-height:1.6;margin:6px 0 0">
      <?= e($p['name']) ?> (Trader <?= $p['idx'] + 1 ?>) পরবর্তী পিরিয়ডের সিগন্যাল তৈরি করে <?= $p['idx'] + 1 ?> ধাপ আগের ড্র-এর ফল অনুসরণ করে (Shift-<?= $p['idx'] + 1 ?>)।
      ৭ ধাপ পর্যন্ত মানি ম্যানেজমেন্ট ফলো করুন, ৭ স্টেপ লস হলে থামুন।
    </p>
  </div>

  <?php sw_foot('SignalWin · Trader Desk'); ?>
</div>
