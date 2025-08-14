<?php
header('Content-Type: application/json');
require_once 'db_connect.php'; // データベース接続を共通化

$card_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($card_id === 0) {
    echo json_encode(['error' => 'Invalid ID']);
    exit;
}

$response = [];

// ★★★ここからが新しいロジック★★★
// ステップ1: 受け取ったcard_idが、セットの一部かどうかを確認する
$stmt = $pdo->prepare("SELECT sets_id FROM card_sets WHERE card_id = ? LIMIT 1");
$stmt->execute([$card_id]);
$set_info = $stmt->fetch(PDO::FETCH_ASSOC);

$card_ids_to_fetch = [];
if ($set_info) {
    // セットの一部だった場合、そのセットに含まれる全てのcard_idを昇順で取得
    $response['is_set'] = true;
    $stmt = $pdo->prepare("SELECT card_id FROM card_sets WHERE sets_id = ? ORDER BY card_id ASC");
    $stmt->execute([$set_info['sets_id']]);
    $card_ids_to_fetch = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // セット名も取得
    $stmt = $pdo->prepare("SELECT sets_name FROM sets WHERE sets_id = ?");
    $stmt->execute([$set_info['sets_id']]);
    $response['set_name'] = $stmt->fetchColumn();

} else {
    // セットの一部でなければ、クリックされたカードのIDだけを対象にする
    $response['is_set'] = false;
    $card_ids_to_fetch[] = $card_id;
}

if (empty($card_ids_to_fetch)) {
    echo json_encode(['error' => 'Card not found']);
    exit;
}
// ★★★ここまでが新しいロジック★★★


// --- 取得対象の全カードの詳細情報をループで取得 ---
$response['cards'] = [];
foreach ($card_ids_to_fetch as $id) {
    $card_details = [];

    // 基本情報
    $stmt = $pdo->prepare("SELECT c.*, cd.* FROM card c JOIN card_detail cd ON c.card_id = cd.card_id WHERE c.card_id = ?");
    $stmt->execute([$id]);
    $card_data = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$card_data) continue;

    // レスポンスに含める基本情報を格納
    $card_details['card_id'] = $card_data['card_id'];
    $card_details['card_name'] = $card_data['card_name'];
    $card_details['modelnum'] = $card_data['modelnum'];
    $card_details['cost'] = ($card_data['cost'] == 2147483647) ? '∞' : ($card_data['cost'] ?? '---');
    $card_details['pow'] = ($card_data['pow'] == 2147483647) ? '∞' : ($card_data['pow'] ?? '---');
    $card_details['mana'] = $card_data['mana'] ?? '---';

    // 種族、文明などの詳細情報を取得
    $stmt = $pdo->prepare("SELECT t.cardtype_name, c.characteristics_name FROM card_cardtype cc JOIN cardtype t ON cc.cardtype_id = t.cardtype_id LEFT JOIN characteristics c ON cc.characteristics_id = c.characteristics_id WHERE cc.card_id = ?");
    $stmt->execute([$id]);
    $type_info = $stmt->fetch(PDO::FETCH_ASSOC);
    $type_parts = [];
    if ($type_info && $type_info['characteristics_id'] != 1 && !empty($type_info['characteristics_name'])) { $type_parts[] = $type_info['characteristics_name']; }
    if ($type_info && !empty($type_info['cardtype_name'])) { $type_parts[] = $type_info['cardtype_name']; }
    $card_details['card_type'] = !empty($type_parts) ? implode('', $type_parts) : '---';

    $stmt = $pdo->prepare("SELECT c.civilization_name FROM card_civilization cc JOIN civilization c ON cc.civilization_id = c.civilization_id WHERE cc.card_id = ?");
    $stmt->execute([$id]);
    $card_details['civilization'] = implode(' / ', $stmt->fetchAll(PDO::FETCH_COLUMN)) ?: '---';

    $stmt = $pdo->prepare("SELECT r.rarity_name FROM card_rarity cr JOIN rarity r ON cr.rarity_id = r.rarity_id WHERE cr.card_id = ? LIMIT 1");
    $stmt->execute([$id]);
    $card_details['rarity'] = $stmt->fetchColumn() ?: '---';

    $stmt = $pdo->prepare("SELECT r.race_name FROM card_race cr JOIN race r ON cr.race_id = r.race_id WHERE cr.card_id = ?");
    $stmt->execute([$id]);
    $card_details['race'] = implode(' / ', $stmt->fetchAll(PDO::FETCH_COLUMN)) ?: '---';

    $stmt = $pdo->prepare("SELECT i.illus_name FROM card_illus ci JOIN illus i ON ci.illus_id = i.illus_id WHERE ci.card_id = ?");
    $stmt->execute([$id]);
    $card_details['illustrator'] = implode(' / ', $stmt->fetchAll(PDO::FETCH_COLUMN)) ?: '---';
    
    // レスポンスの'cards'配列に、このカードの全情報を追加
    $response['cards'][] = $card_details;
}

// ★★★セットカード用の画像とテキスト情報を追加★★★
if ($response['is_set'] && !empty($response['cards'])) {
    $modelnum = $response['cards'][0]['modelnum']; // セットの代表modelnum

    // 画像パス
    $image_urls = [];
    if ($modelnum) {
        $folder_path = "card/" . $modelnum;
        foreach (range('a', 'z') as $char) {
            $file_path = $folder_path . "/" . $modelnum . $char . ".webp";
            if (file_exists($file_path)) { $image_urls[$char] = $file_path; } 
            else { break; }
        }
    }
    $response['image_urls'] = $image_urls;

    // テキスト
    $response['texts'] = process_text_from_file($modelnum, 'text');
    $response['flavortexts'] = process_text_from_file($modelnum, 'flavortext');
}


echo json_encode($response);


// --- ヘルパー関数 (ファイルの最後に移動) ---
function process_text_from_file($modelnum, $file_type) {
    if (!$modelnum) return [];
    $folder_path = $file_type . "/" . $modelnum;
    if (!is_dir($folder_path)) return [];

    $parts = [];
    foreach (range('a', 'z') as $char) {
        $file_path = $folder_path . "/" . $modelnum . $char . ".txt";
        if (file_exists($file_path)) {
            $content = file_get_contents($file_path);
            $parts[$char] = ($content !== false) ? trim($content) : '';
        } else {
            break;
        }
    }
    return $parts;
}
?>
