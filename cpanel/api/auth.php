<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    sw_json(['valid' => false, 'reason' => 'method_not_allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw !== false ? $raw : '', true);
if (!is_array($body)) sw_json(['valid' => false, 'reason' => 'invalid_request'], 400);

$action = (string) ($body['action'] ?? '');
if ($action === 'verify') {
    $password = (string) ($body['password'] ?? '');
    if ($password === '' || !hash_equals(SW_PASSWORD_SHA256, hash('sha256', $password))) {
        usleep(250000);
        sw_json(['valid' => false, 'reason' => 'wrong_password']);
    }
    $session = sw_session_create();
    sw_json(['valid' => true, 'token' => $session['token'], 'expiresAt' => $session['expiresAt']]);
}

if ($action === 'session') {
    $valid = sw_session_valid((string) ($body['token'] ?? ''));
    sw_json(['valid' => $valid, 'reason' => $valid ? null : 'invalid_session']);
}

sw_json(['valid' => false, 'reason' => 'invalid_action'], 400);