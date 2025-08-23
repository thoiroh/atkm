<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

echo json_encode([
  'message' => 'Atomeek DataMatrix API',
  'status' => 'running',
  'timestamp' => date('Y-m-d H:i:s')
]);
