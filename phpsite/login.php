<?php
declare(strict_types=1);
require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/layout.php';

session_start();
$error = '';
$next = (string) ($_GET['next'] ?? $_POST['next'] ?? sw_url('index.php'));
if (!str_starts_with($next, '/')) $next = sw_url('index.php');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (hash_equals(SW_PASSWORD, trim((string) ($_POST['password'] ?? '')))) {
        $_SESSION['sw_ok'] = true;
        header('Location: ' . $next);
        exit;
    }
    usleep(300000);
    $error = 'ভুল পাসওয়ার্ড — আবার চেষ্টা করুন।';
}

sw_head('Access — SignalWin', 'Enter your access password to open SignalWin predictions.');
?>
<div class="center">
  <div class="card" style="padding:22px;max-width:380px;width:100%">
    <span class="glow" style="background:var(--primary)"></span>
    <div style="text-align:center"><?php sw_brand(); ?></div>
    <div class="eyebrow" style="text-align:center;margin-top:14px">Secure Access</div>
    <h2 style="margin:6px 0 4px;text-align:center;font-size:18px;font-weight:900">পাসওয়ার্ড দিন</h2>
    <p class="muted" style="text-align:center;font-size:12.5px;margin:0 0 16px">শুধু অনুমোদিত ব্যবহারকারীরাই লাইভ সিগন্যাল দেখতে পারবেন।</p>
    <form method="post">
      <input type="hidden" name="next" value="<?= e($next) ?>">
      <input class="input" type="password" name="password" placeholder="XXXX-XXXX-XXXX" autocomplete="off" autofocus required>
      <?php if ($error): ?><div class="err"><?= e($error) ?></div><?php endif; ?>
      <button class="btn" style="margin-top:12px" type="submit">Unlock Signals</button>
    </form>
    <a class="btn ghost" style="margin-top:8px;text-align:center" href="<?= e(SW_TELEGRAM) ?>" target="_blank" rel="noopener">Get Password on Telegram</a>
    <a class="btn ghost" style="margin-top:8px;text-align:center" href="<?= e(sw_url('index.php')) ?>">← হোমে ফিরে যান</a>
  </div>
</div>
<?php sw_foot('SignalWin · Secure Gate'); ?>
