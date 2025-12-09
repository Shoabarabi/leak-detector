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

    // ===== NEW: Add IP address and cluster_id to POST data =====
    try {
        $inputData = json_decode($input, true);
        
        // Add IP address (automatic from server)
        

        // Get real visitor IP (handles proxies/Cloudflare)
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $ipAddress = $_SERVER['HTTP_CF_CONNECTING_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ipAddress = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        }

        $inputData['ipAddress'] = $ipAddress;
        
        // Add cluster_id from GET parameter (if available)
        $inputData['cluster_id'] = $_GET['cluster_id'] ?? 'C0';
        
        // Re-encode the updated data
        $input = json_encode($inputData);
    } catch (Exception $e) {
        // If JSON parsing fails, still continue (graceful fallback)
        error_log('JSON parse error in proxy.php: ' . $e->getMessage());
    }
    // ===== END NEW =====
    
    
    $ch = curl_init($googleUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    // **FIXED LOGIC:** Pass the actual response from Google back to the frontend
    if ($error) {
        echo json_encode(['success' => false, 'error' => 'Proxy network error: ' . $error]);
    } else {
        // Echo the JSON response from the Google Apps Script directly
        echo $response; 
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
    $url .= '&name=' . urlencode($_GET['name']);        // ADD THIS
    $url .= '&company=' . urlencode($_GET['company']);  // ADD THIS
    $url .= '&email=' . urlencode($_GET['email']);      // ADD THIS

    // ===== NEW: Add IP address and cluster_id to GET requests =====
    

    // Get real visitor IP
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $ipAddress = $_SERVER['HTTP_CF_CONNECTING_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ipAddress = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    }

    $url .= '&ipAddress=' . urlencode($ipAddress);


    $url .= '&cluster_id=' . urlencode($_GET['cluster_id'] ?? 'C0');
    // ===== END NEW =====



}

// ========================================
// NEW: Add these 3 lines here
// ========================================
if ($action === 'getReportData') {
    $url .= '&sessionId=' . urlencode($_GET['sessionId'] ?? '');
}
// ========================================

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