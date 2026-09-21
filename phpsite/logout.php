<?php
declare(strict_types=1);
require __DIR__ . '/lib/config.php';
session_start();
$_SESSION = [];
session_destroy();
header('Location: ' . sw_url('index.php'));
