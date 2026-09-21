<?php
// CLI cron entry:  php -q /home/USER/public_html/bdwineiplat/api/cron.php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('cli only'); }

require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ingest.php';

$res = sw_ingest_all();
fwrite(STDOUT, date('c') . ' ' . json_encode($res) . PHP_EOL);
