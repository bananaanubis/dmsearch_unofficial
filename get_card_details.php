<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

// ★★★ すべてのヘルパー関数を、ファイルの最初に一度だけ定義する ★★★
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
function format_ability_text($raw_text) {
    if (!$raw_text || trim($raw_text) === '') return '（テキスト情報なし）';
    $lines = explode("\n", $raw_text);
    $processed_lines = [];
    foreach ($lines as $line) {
        $trimmed_line = trim($line);
        if (empty($trimmed_line)) continue;
        $escaped_line = htmlspecialchars($trimmed_line);
        $replacements = [
            '{br}' => '<img src="parts/card_list_block.webp" class="text-icon">',
            '{st}' => '<img src="parts/card_list_strigger.webp" class="text-icon">',
        ];
        $escaped_line = str_replace(array_keys($replacements), array_values($replacements), $escaped_line);
        $processed_lines[] = '■ ' . $escaped_line;
    }
    return implode('<br>', $processed_lines);
}
function format_flavor_text($raw_text) {
    if (!$raw_text || trim($raw_text) === '') return null;
    return nl2br(htmlspecialchars(trim($raw_text)));
}
// ★★★ ヘルパー関数の定義はここまで ★★★


$card_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($card_id === 0) {
    echo json_encode(['error' => 'Invalid ID']);
    exit;
}
$response = [];

$stmt = $pdo->prepare("SELECT sets_id FROM card_sets WHERE card_id = ? LIMIT 1");
$stmt->execute([$card_id]);
$set_info = $stmt->fetch(PDO::FETCH_ASSOC);

if ($set_info) {
    // === セットカードの処理 ===
    $response['is_set'] = true;
    $stmt = $pdo->prepare("SELECT sets_name FROM sets WHERE sets_id = ?");
    $stmt->execute([$set_info['sets_id']]);
    $response['set_name'] = $stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT c.*, cd.* FROM card_sets cs JOIN card c ON cs.card_id = c.card_id JOIN card_detail cd ON c.card_id = cd.card_id WHERE cs.sets_id = ? ORDER BY cs.card_id ASC");
    $stmt->execute([$set_info['sets_id']]);
    $response['cards'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($response['cards'])) {
        $modelnum = $response['cards'][0]['modelnum'] ?? null;
        $response['texts'] = process_text_from_file($modelnum, 'text');
        $response['flavortexts'] = process_text_from_file($modelnum, 'flavortext');
        
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
    }

} else {
    // === 通常カードの処理 ===
    $response['is_set'] = false;
    $stmt = $pdo->prepare("SELECT c.*, cd.* FROM card c JOIN card_detail cd ON c.card_id = cd.card_id WHERE c.card_id = ?");
    $stmt->execute([$card_id]);
    $card_data = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$card_data) {
        echo json_encode(['error' => 'Card not found']);
        exit;
    }
    $response['cards'] = [$card_data];
}

// --- 各カードの共通詳細情報（種族、文明など）をループで取得・追加 ---
foreach ($response['cards'] as &$card) { // 参照渡し(&)を使う
    $current_card_id = $card['card_id'];
    
    // カードの種類
    $stmt = $pdo->prepare("SELECT t.cardtype_name, c.characteristics_name, cc.characteristics_id FROM card_cardtype cc JOIN cardtype t ON cc.cardtype_id = t.cardtype_id LEFT JOIN characteristics c ON cc.characteristics_id = c.characteristics_id WHERE cc.card_id = ?");
    $stmt->execute([$current_card_id]);
    $type_info = $stmt->fetch(PDO::FETCH_ASSOC);
    $type_parts = [];
    if ($type_info && $type_info['characteristics_id'] != 1 && !empty($type_info['characteristics_name'])) { $type_parts[] = $type_info['characteristics_name']; }
    if ($type_info && !empty($type_info['cardtype_name'])) { $type_parts[] = $type_info['cardtype_name']; }
    $card['card_type'] = !empty($type_parts) ? implode('', $type_parts) : '---';

    // 文明
    $stmt = $pdo->prepare("SELECT c.civilization_name FROM card_civilization cc JOIN civilization c ON cc.civilization_id = c.civilization_id WHERE cc.card_id = ?");
    $stmt->execute([$current_card_id]);
    $card['civilization'] = implode(' / ', $stmt->fetchAll(PDO::FETCH_COLUMN)) ?: '---';

    // レアリティ
    $stmt = $pdo->prepare("SELECT r.rarity_name FROM card_rarity cr JOIN rarity r ON cr.rarity_id = r.rarity_id WHERE cr.card_id = ? LIMIT 1");
    $stmt->execute([$current_card_id]);
    $card['rarity'] = $stmt->fetchColumn() ?: '---';
    
    // 種族
    $stmt = $pdo->prepare("SELECT r.race_name FROM card_race cr JOIN race r ON cr.race_id = r.race_id WHERE cr.card_id = ?");
    $stmt->execute([$current_card_id]);
    $card['race'] = implode(' / ', $stmt->fetchAll(PDO::FETCH_COLUMN)) ?: '---';
    
    // イラストレーター
    $stmt = $pdo->prepare("SELECT i.illus_name FROM card_illus ci JOIN illus i ON ci.illus_id = i.illus_id WHERE ci.card_id = ?");
    $stmt->execute([$current_card_id]);
    $card['illustrator'] = implode(' / ', $stmt->fetchAll(PDO::FETCH_COLUMN)) ?: '---';

    // ★★★ 通常カードの場合のみ、テキストとフレーバーをここでフォーマット ★★★
    if (!$response['is_set']) {
        // 能力テキスト
        $modelnum = $card['modelnum'] ?? null;
        $single_text_file = $modelnum ? "text/" . $modelnum . ".txt" : null;
        if ($single_text_file && file_exists($single_text_file)) {
            $card['text'] = format_ability_text(file_get_contents($single_text_file));
        } else {
            $card['text'] = format_ability_text($card['text'] ?? '');
        }

        // フレーバーテキスト
        $single_flavor_file = $modelnum ? "flavortext/" . $modelnum . ".txt" : null;
        if ($single_flavor_file && file_exists($single_flavor_file)) {
            $card['flavortext'] = format_flavor_text(file_get_contents($single_flavor_file));
        } else {
             $card['flavortext'] = format_flavor_text($card['flavortext'] ?? '');
        }
    }
}
unset($card); // ループ後の参照を解除

echo json_encode($response);
?>
