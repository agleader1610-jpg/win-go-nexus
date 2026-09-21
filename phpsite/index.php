<?php
declare(strict_types=1);
require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/feed.php';
require __DIR__ . '/lib/layout.php';

$cards = [];
foreach (sw_games() as $g) {
    $rows = sw_draws($g['id']);
    $last = $rows[0] ?? null;
    $cards[] = [
        'g' => $g,
        'live' => (bool) $last,
        'next' => $last ? sw_inc_str((string) $last['issueNumber']) : '',
        'val' => $last ? ($g['kind'] === 'k3' ? ($last['sum'] ?? '-') : ($last['number'] !== '' ? $last['number'] : '-')) : null,
    ];
}
$liveCount = count(array_filter($cards, fn ($c) => $c['live']));

sw_head('SignalWin — AI Lottery Signal Engine', 'Live AI prediction signals for WinGo, K3 Dice, and TrxWinGo.');
sw_notice();
?>
<div class="wrap">
  <div class="topbar">
    <?php sw_brand(); ?>
    <span class="pill">✦ AI Powered</span>
  </div>

  <div class="statusstrip">
    <span class="live <?= $liveCount ? '' : 'off' ?>"><i class="led"></i><?= $liveCount ? 'Live' : 'Offline' ?></span>
    <span class="eyebrow"><?= $liveCount ? $liveCount . ' markets · sync' : 'No data' ?></span>
  </div>

  <h1 style="position:absolute;left:-9999px">SignalWin — AI Lottery Signal Engine</h1>

  <div class="sec"><span style="color:var(--primary)">✦</span><h2>Prediction Markets</h2><span class="line"></span></div>

  <?php foreach ($cards as $c): $g = $c['g']; $a = $g['accent']; ?>
    <a class="card gamecard" href="<?= e(sw_url('game.php')) ?>?game=<?= e($g['id']) ?>&amp;cat=bs">
      <span class="glow" style="background:<?= e($a) ?>"></span>
      <span class="icon" style="border-color:<?= e($a) ?>59;background:<?= e($a) ?>1f;box-shadow:0 0 22px -6px <?= e($a) ?>"><?= sw_icon_for($g['kind']) ?></span>
      <span class="grow">
        <span class="flex"><h3 class="trunc"><?= e($g['short']) ?></h3>
          <span class="tag" style="border-color:<?= e($a) ?>66;background:<?= e($a) ?>1f;color:<?= e($a) ?>"><?= $c['live'] ? 'Active' : 'Sync' ?></span>
        </span>
        <span class="sub trunc"><?= e(sw_kind_label($g['kind'])) ?> · <?= e(sw_period_label($g['periodSec'])) ?></span>
        <span class="sub" style="color:<?= e($a) ?>"><?= $c['live'] ? 'Live Now' : 'Connecting' ?><?= $c['next'] ? ' · #' . e(substr($c['next'], -8)) : '' ?></span>
      </span>
      <span class="numbox" style="border-color:<?= e($a) ?>59;background:<?= e($a) ?>1f;color:<?= e($a) ?>"><?= e((string) ($c['val'] ?? '··')) ?></span>
      <span class="chev">›</span>
    </a>
  <?php endforeach; ?>

  <div class="card vip">
    <span class="glow" style="background:var(--amber)"></span>
    <span class="icon">♛</span>
    <span class="grow">
      <span class="flex"><h3>Pro Predictors</h3><span class="tag" style="border-color:rgba(251,191,36,.5);background:rgba(251,191,36,.16);color:var(--amber)">VIP</span></span>
      <span class="sub">10 expert engines · auto-ranked by win rate</span>
    </span>
    <span class="numbox" style="border-color:rgba(251,191,36,.45);background:rgba(251,191,36,.15);color:var(--amber)">⚡</span>
  </div>

  <?php sw_foot(); ?>
</div>
