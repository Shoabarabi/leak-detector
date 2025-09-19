<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$googleUrl = 'https://script.google.com/macros/s/AKfycbyCdYzknIjeDe8hc8qO-P_n4ansZvZGNEEiT7obt-XLmff0ryFNk2s2vcwgdQ5p0Q-ptg/exec';

// Handle POST for email sending
// Handle POST for email sending
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    
    $ch = curl_init($googleUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);  // This follows redirects
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    // If curl succeeded (no network errors), assume email was sent
    if (!$error) {
        echo json_encode(['success' => true, 'message' => 'Report sent successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Network error: ' . $error]);
    }
    exit;
}

// Handle GET requests (keep your existing GET code below)
$action = $_GET['action'] ?? '';
$url = $googleUrl . '?action=' . urlencode($action);

if ($action === 'calculateLeakage') {
    $url .= '&industry=' . urlencode($_GET['industry']);
    $url .= '&revenue=' . urlencode($_GET['revenue']);
    $url .= '&sessionId=' . urlencode($_GET['sessionId']);
    $url .= '&responses=' . urlencode($_GET['responses']);
}

// Use cURL for GET requests
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo json_encode(['error' => 'Proxy error: ' . $error]);
} else {
    echo $response;
}
?>