<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Testing Proxy Response from Google Apps Script</h2>";

$testData = [
    'action' => 'sendEmailReport',
    'leadEmail' => 'test@example.com',
    'result' => [
        'industry' => 'Test Industry',
        'revenue' => 1000000,
        'totalLeakagePercent' => 25,
        'totalLeakageDollars' => 250000,
        'topThreeLeaks' => [],
        'leaks' => [],
        'potentialRecovery' => 100000,
        'sessionId' => 'test_session'
    ]
];

// First, test the proxy.php endpoint
echo "<h3>1. Testing YOUR proxy.php:</h3>";
$ch = curl_init('https://leakdetector.mainnov.tech/proxy.php');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

echo "Response: <pre>" . htmlspecialchars($response) . "</pre>";
echo "Error: " . $error . "<br><br>";

// Now test Google Apps Script directly
echo "<h3>2. Testing Google Apps Script DIRECTLY:</h3>";
$googleUrl = 'https://script.google.com/macros/s/AKfycbyCdYzknIjeDe8hc8qO-P_n4ansZvZGNEEiT7obt-XLmff0ryFNk2s2vcwgdQ5p0Q-ptg/exec';

$ch2 = curl_init($googleUrl);
curl_setopt($ch2, CURLOPT_POST, 1);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch2, CURLOPT_HEADER, true); // Include headers in response
curl_setopt($ch2, CURLOPT_FOLLOWLOCATION, false); // Don't follow redirects
curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);

$responseWithHeaders = curl_exec($ch2);
$httpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch2, CURLINFO_HEADER_SIZE);
curl_close($ch2);

// Separate headers and body
$headers = substr($responseWithHeaders, 0, $headerSize);
$body = substr($responseWithHeaders, $headerSize);

echo "<strong>HTTP Status Code:</strong> " . $httpCode . "<br><br>";
echo "<strong>Response Headers:</strong><pre>" . htmlspecialchars($headers) . "</pre>";
echo "<strong>Response Body:</strong><pre>" . htmlspecialchars(substr($body, 0, 1000)) . "</pre>";

// Check for redirect
if ($httpCode == 302 || $httpCode == 301) {
    preg_match('/^Location: (.+?)$/m', $headers, $matches);
    if (isset($matches[1])) {
        echo "<strong>Redirect URL Found:</strong> " . htmlspecialchars($matches[1]) . "<br><br>";
        
        echo "<h3>3. Following the redirect:</h3>";
        $redirectUrl = trim($matches[1]);
        $ch3 = curl_init($redirectUrl);
        curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch3, CURLOPT_SSL_VERIFYPEER, false);
        $finalResponse = curl_exec($ch3);
        $finalHttpCode = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
        curl_close($ch3);
        
        echo "Final HTTP Code: " . $finalHttpCode . "<br>";
        echo "Final Response: <pre>" . htmlspecialchars(substr($finalResponse, 0, 1000)) . "</pre>";
    } else {
        echo "<strong>No Location header found in redirect!</strong><br>";
    }
} else {
    echo "<strong>No redirect - Google returned status $httpCode directly</strong><br>";
    echo "This is why your proxy returns 'Redirect URL not found'<br>";
}
?>