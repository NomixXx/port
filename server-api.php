<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Конфигурация
$config = [
    'upload_dir' => 'uploads/',
    'data_dir' => 'data/',
    'max_file_size' => 50 * 1024 * 1024, // 50MB
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar']
];

// Создание директорий если не существуют
if (!file_exists($config['upload_dir'])) {
    mkdir($config['upload_dir'], 0755, true);
}
if (!file_exists($config['data_dir'])) {
    mkdir($config['data_dir'], 0755, true);
}

// Роутинг
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($path, $config);
        break;
    case 'POST':
        handlePost($path, $config);
        break;
    case 'PUT':
        handlePut($path, $config);
        break;
    case 'DELETE':
        handleDelete($path, $config);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGet($path, $config) {
    if ($path === '/health') {
        echo json_encode(['status' => 'ok', 'timestamp' => time()]);
        return;
    }
    
    if (strpos($path, '/data/') === 0) {
        $key = substr($path, 6);
        $filename = $config['data_dir'] . $key . '.json';
        
        if (file_exists($filename)) {
            $data = json_decode(file_get_contents($filename), true);
            echo json_encode(['success' => true, 'data' => $data]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Data not found']);
        }
        return;
    }
    
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

function handlePost($path, $config) {
    if ($path === '/upload') {
        handleFileUpload($config);
        return;
    }
    
    if ($path === '/data') {
        handleDataSave($config);
        return;
    }
    
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

function handleFileUpload($config) {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        return;
    }
    
    $file = $_FILES['file'];
    $sectionId = $_POST['sectionId'] ?? '';
    $subsectionId = $_POST['subsectionId'] ?? '';
    
    // Проверка размера файла
    if ($file['size'] > $config['max_file_size']) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large']);
        return;
    }
    
    // Проверка расширения
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, $config['allowed_extensions'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File type not allowed']);
        return;
    }
    
    // Генерация уникального имени файла
    $filename = uniqid() . '_' . $file['name'];
    $filepath = $config['upload_dir'] . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode([
            'success' => true,
            'url' => '/uploads/' . $filename,
            'filename' => $file['name'],
            'size' => $file['size'],
            'type' => $file['type']
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }
}

function handleDataSave($config) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['key']) || !isset($input['data'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing key or data']);
        return;
    }
    
    $key = $input['key'];
    $data = $input['data'];
    $filename = $config['data_dir'] . $key . '.json';
    
    if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save data']);
    }
}

function handlePut($path, $config) {
    http_response_code(501);
    echo json_encode(['error' => 'Not implemented']);
}

function handleDelete($path, $config) {
    http_response_code(501);
    echo json_encode(['error' => 'Not implemented']);
}
?>