<?php
declare(strict_types=1);
require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/feed.php';
require __DIR__ . '/lib/logic.php';
require __DIR__ . '/lib/layout.php';

sw_require_login();

$cfg = sw_game((string) ($_GET['game'] ?? ''));
if (!$cfg) { header('Location: ' . sw_url('index.php')); exit; }
$cat = sw_category((string) ($_GET['cat'] ?? 'bs'));

$rows = sw_draws($cfg['id']);
$next = $rows ? sw_inc_str((string) $rows[0]['issueNumber']) : '';
$ranked = sw_ranked($rows, $cat['id'], $next, $cfg['id'], $cfg['kind']);
$hidden = count(sw_predictors()) - count($ranked);

sw_head($cfg['label'] . ' — SignalWin', 'Live AI signals from 10 expert predictors for ' . $cfg['label'] . '.', $cfg['periodSec']);
sw_notice();
?>
<div class="wrap">
  <div class="topbar">
    <a class="iconbtn" href="<?= e(sw_url('index.php')) ?>" aria-label="Back">←</a>
    <?php sw_brand(); ?>
    <a class="iconbtn" href="<?= e(sw_url('logout.php')) ?>" aria-label="Lock">⎋</a>
  </div>

  <div class="card gamehead">
    <span class="glow" style="background:<?= e($cfg['accent']) ?>"></span>
    <span class="icon" style="border-color:<?= e($cfg['accent']) ?>59;background:<?= e($cfg['accent']) ?>1f"><?= sw_icon_for($cfg['kind']) ?></span>
    <span class="grow">
      <h1 class="trunc" style="margin:0;font-size:15.5px;font-weight:900"><?= e($cfg['label']) ?></h1>
      <span class="sub trunc"><i class="led" style="color:var(--green)"></i><?= $rows ? 'Live' : 'Reconnecting' ?> · Period #<?= e($next !== '' ? substr($next, -10) : '————') ?></span>
    </span>
    <span class="numbox" style="border-color:rgba(34,211,238,.35);background:rgba(34,211,238,.12);color:var(--primary)" id="sw-countdown">··</span>
  </div>

  <div class="card tabs">
    <?php foreach (sw_categories() as $c): ?>
      <a class="<?= $c['id'] === $cat['id'] ? 'on' : '' ?>" href="?game=<?= e($cfg['id']) ?>&amp;cat=<?= e($c['id']) ?>"><?= e($c['short']) ?></a>
    <?php endforeach; ?>
  </div>

  <div class="card rules">
    <div class="flex">
      <span class="iconbtn" style="color:var(--primary);border-color:rgba(34,211,238,.35);background:rgba(34,211,238,.14)">🛡</span>
      <div>
        <div class="eyebrow" style="color:var(--primary)">Trading Rules</div>
        <b style="font-size:14px">Money Management · 7-Step Plan</b>
      </div>
    </div>
    <ul>
      <li><b>Money Management</b><small>প্রতি ট্রেডে ক্যাপিটালের ১–২% ব্যবহার করুন।</small></li>
      <li><b>7-Step Strategy</b><small>সর্বোচ্চ ৭ স্টেপ পর্যন্ত মার্টিংগেল ফলো করুন।</small></li>
      <li><b>Signal Discipline</b><small>শুধু লাইভ ও Pro সিগন্যাল অনুসরণ করুন।</small></li>
      <li class="warn"><b>Stop Rule</b><small>৭ স্টেপ লস হলে থামুন · পরের রাউন্ডে আসুন।</small></li>
    </ul>
  </div>

  <div class="flex" style="justify-content:space-between;margin:18px 2px 12px">
    <div>
      <div class="eyebrow" style="color:var(--primary)"><?= e($cat['label']) ?></div>
      <h2 style="margin:5px 0 0;font-size:18px;font-weight:900">Expert Predictors</h2>
    </div>
    <span class="pill"><?= count($ranked) ?> Live</span>
  </div>

  <?php if (!$ranked): ?>
    <div class="card" style="padding:16px;text-align:center;color:var(--fg-dim);font-size:13px">
      সংরক্ষিত ডাটা এখনো নেই · cron URL একবার চালু হলে সিগন্যাল দেখা যাবে।
    </div>
  <?php endif; ?>

  <?php foreach ($ranked as $i => $r): $p = $r['p']; $s = $r['s'];
      $disp = $s['pending']['display'] ?? '—';
      $isColor = $cat['id'] === 'color';
      $col = $isColor ? sw_color_hex($disp) : ($disp === 'Big' ? '#25e39a' : ($disp === 'Small' ? '#ff5c5c' : $cat['accent']));
  ?>
    <a class="card trader" href="<?= e(sw_url('trader.php')) ?>?game=<?= e($cfg['id']) ?>&amp;cat=<?= e($cat['id']) ?>&amp;trader=<?= e($p['id']) ?>">
      <span class="rank">#<?= $i + 1 ?></span>
      <span class="mono-logo" style="background:linear-gradient(140deg,<?= e($p['brand']) ?>,<?= e($p['brand']) ?>88)"><?= e(strtoupper(substr($p['name'], 0, 2))) ?></span>
      <span class="grow">
        <span class="flex"><h3 class="trunc"><?= e($p['name']) ?></h3>
          <span class="tag" style="border-color:<?= e($p['brand']) ?>66;color:<?= e($p['brand']) ?>">T<?= $p['idx'] + 1 ?></span>
        </span>
        <span class="sub trunc"><?= e($p['tag']) ?> · <?= sw_hit_rate($s, $p['idx']) ?>% hit</span>
        <span class="streak">
          <?php foreach (array_slice($s['rows'], 0, 10) as $row): ?>
            <i class="<?= $row['result'] === 'WIN' ? 'w' : 'l' ?>"></i>
          <?php endforeach; ?>
        </span>
      </span>
      <span class="signal">
        <span class="val" style="color:<?= e($col) ?>;text-transform:<?= $isColor ? 'capitalize' : 'none' ?>"><?= e(strtoupper((string) $disp)) ?></span><br>
        <span class="cf"><?= (int) ($s['pending']['confidence'] ?? 0) ?>% conf</span><br>
        <span class="badge win"><?= (int) $s['wins'] ?>W</span> <span class="badge loss"><?= (int) $s['losses'] ?>L</span>
      </span>
    </a>
  <?php endforeach; ?>

  <?php if ($hidden > 0): ?>
    <div class="card" style="padding:11px;text-align:center;font-family:var(--mono);font-size:11px;color:var(--fg-dim)">
      <?= $hidden ?> predictor<?= $hidden > 1 ? 's' : '' ?> auto-hidden · 7 consecutive losses
    </div>
  <?php endif; ?>

  <?php sw_foot('SignalWin · 10 Expert AI Engine'); ?>
</div>
