// === ページの読み込み完了後に実行される処理 ===
document.addEventListener('DOMContentLoaded', () => {

    // --- ① 操作する要素をまとめて取得 ---
    const searchForm = document.getElementById('searchForm');
    const resetBtn = document.getElementById('resetBtn');

    // 折りたたみ機能の要素
    const toggleAdvancedBtn = document.getElementById('toggle-advanced-btn');
    const advancedSearchArea = document.getElementById('advanced-search-area');
    const advancedStateInput = document.getElementById('advanced-state');

    // チェックボックス関連
    const toggleBtn = document.getElementById('toggleBtn');
    const searchCheckboxes = document.querySelectorAll('.checkbox-container input[type="checkbox"]');

    // 文明ボタン関連
    const monoColorBtn = document.querySelector('[data-target-input="mono_color"]');
    const multiColorBtn = document.querySelector('[data-target-input="multi_color"]');
    const mainCivButtons = document.querySelectorAll('#main-civs-buttons .civ-btn');
    const excludeSection = document.getElementById('exclude-civs-section');
    const excludeCivWrappers = document.querySelectorAll('.exclude-civ-wrapper');
    
    // コスト関連の要素
    const costMinInput = document.getElementById('cost_min_input');
    const costMaxInput = document.getElementById('cost_max_input');
    const costZeroCheck = document.getElementById('cost_zero_check');
    const costInfinityCheck = document.getElementById('cost_infinity_check');

    // パワー関連の要素
    const powMinInput = document.getElementById('pow_min_input');
    const powMaxInput = document.getElementById('pow_max_input');
    const powInfinityCheck = document.getElementById('pow_infinity_check');

    // 商品ドロップダウンの要素
    const goodsTypeSelect = document.querySelector('select[name="goodstype_id_filter"]');
    const goodsSelect = document.querySelector('select[name="goods_id_filter"]');

    // 並び替え関連の要素
    const sortOrderSelect = document.getElementById('sort-order');
    const sortOrderHiddenInput = document.getElementById('sort-order-hidden');

    // --- ② 状態更新のための共通関数 ---

    // コスト入力欄の有効/無効を切り替える関数
    const toggleCostInputs = () => {
        if (!costZeroCheck || !costInfinityCheck || !costMinInput || !costMaxInput) return;
        const disable = costZeroCheck.checked || costInfinityCheck.checked;
        costMinInput.disabled = disable;
        costMaxInput.disabled = disable;
        if (disable) {
            costMinInput.value = '';
            costMaxInput.value = '';
        }
    };

    // パワー入力欄の有効/無効を切り替える関数
    const togglePowerInputs = () => {
        if (!powInfinityCheck || !powMinInput || !powMaxInput) return;
        const disable = powInfinityCheck.checked;
        powMinInput.disabled = disable;
        powMaxInput.disabled = disable;
        if (disable) {
            powMinInput.value = '';
            powMaxInput.value = '';
        }
    };

    // 文明コントロールの表示状態を更新する関数
    function updateCivilizationControls() {
        if (!multiColorBtn || mainCivButtons.length === 0) return;
        const isMultiOn = !multiColorBtn.classList.contains('is-off');
        const isAnyMainCivOnExcludingColorless = [...mainCivButtons].some(btn => {
            return !btn.classList.contains('is-off') && btn.dataset.civId !== '6';
        });
        
        if (excludeSection) {
            excludeSection.style.display = (isMultiOn && isAnyMainCivOnExcludingColorless) ? 'block' : 'none';
        }

        const mainCivStatus = {};
        mainCivButtons.forEach(btn => {
            mainCivStatus[btn.dataset.civId] = !btn.classList.contains('is-off');
        });
        excludeCivWrappers.forEach(wrapper => {
            const civId = wrapper.id.replace('exclude-wrapper-', '');
            wrapper.style.display = mainCivStatus[civId] === false ? 'block' : 'none';
        });
    }
    
    // 検索対象チェックボックスのラベルを更新する関数
    const updateToggleButtonLabel = () => {
        if (!toggleBtn) return;
        const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
        toggleBtn.textContent = anyChecked ? '全解除' : '全選択';
    };

    // --- ③ イベントリスナーの設定 ---
    
    if (toggleAdvancedBtn) {
        toggleAdvancedBtn.addEventListener('click', () => {
            const isOpen = advancedSearchArea.classList.contains('is-open');
            advancedSearchArea.classList.toggle('is-open', !isOpen);
            toggleAdvancedBtn.textContent = isOpen ? 'さらに条件をしぼる' : '条件を隠す';
            advancedStateInput.value = isOpen ? '0' : '1';
        });
    }

    if (goodsTypeSelect) {
        goodsTypeSelect.addEventListener('change', () => {
            fetch(`api.php?type=goods&goodstype_id=${goodsTypeSelect.value}`)
                .then(response => response.json())
                .then(data => {
                    goodsSelect.innerHTML = '<option value="0">指定なし</option>';
                    data.forEach(goods => {
                        goodsSelect.appendChild(new Option(goods.name, goods.id));
                    });
                });
        });
    }
    
    if (costZeroCheck) {
        costZeroCheck.addEventListener('change', () => {
            if (costZeroCheck.checked) costInfinityCheck.checked = false;
            toggleCostInputs();
        });
    }
    if (costInfinityCheck) {
        costInfinityCheck.addEventListener('change', () => {
            if (costInfinityCheck.checked) costZeroCheck.checked = false;
            toggleCostInputs();
        });
    }
    
    if (powInfinityCheck) {
        powInfinityCheck.addEventListener('change', togglePowerInputs);
    }

    if (searchForm) {
        searchForm.addEventListener('click', (e) => {
            const button = e.target.closest('.civ-btn');
            if (!button) return;
            const isTurningOff = !button.classList.contains('is-off');
            if (button === monoColorBtn && isTurningOff && multiColorBtn.classList.contains('is-off')) return;
            if (button === multiColorBtn && isTurningOff && monoColorBtn.classList.contains('is-off')) return;
            
            const targetInput = document.getElementById(button.dataset.targetInput);
            button.classList.toggle('is-off');
            if (targetInput) {
                targetInput.value = button.classList.contains('is-off') ? '0' : (button.dataset.civId || '1');
            }
            updateCivilizationControls();
        });
    }
    
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', () => {
            sortOrderHiddenInput.value = sortOrderSelect.value;
            searchForm.submit();
        });
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
            searchCheckboxes.forEach(cb => cb.checked = !anyChecked);
            updateToggleButtonLabel();
        });
    }
    searchCheckboxes.forEach(cb => cb.addEventListener('change', updateToggleButtonLabel));

    // ★★★★★ リセットボタンの処理を再構築 ★★★★★
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            
            // 1. 基本的なフォーム要素をリセット
            if (searchForm) searchForm.reset();

            // 2. カスタムUIと状態を確実にデフォルトに戻す
            // 2-1. 検索対象チェックボックス
            document.querySelector('input[name="search_name"]').checked = true;
            document.querySelector('input[name="search_reading"]').checked = true;
            document.querySelector('input[name="search_text"]').checked = true;
            document.querySelector('input[name="search_race"]').checked = false;
            document.querySelector('input[name="search_flavortext"]').checked = false;
            document.querySelector('input[name="search_illus"]').checked = false;
            
            // 2-2. 文明ボタン
            document.querySelectorAll('.civ-btn').forEach(button => {
                const targetInput = document.getElementById(button.dataset.targetInput);
                if (!targetInput) return;
                const buttonId = button.dataset.targetInput;
                if (buttonId === 'mono_color' || buttonId === 'multi_color') {
                    button.classList.remove('is-off');
                    targetInput.value = '1';
                } else {
                    button.classList.add('is-off');
                    targetInput.value = '0';
                }
            });
            
            // 2-3. 並び替えの隠しフィールド
            if (sortOrderHiddenInput) sortOrderHiddenInput.value = 'release_new';

            // 3. 全てのUI状態更新関数を呼び出して、表示を完全に同期させる
            updateToggleButtonLabel();
            updateCivilizationControls();
            toggleCostInputs();
            togglePowerInputs();
            
            // 4. 商品リストをリセットするためにchangeイベントを発火
            if (goodsTypeSelect) goodsTypeSelect.dispatchEvent(new Event('change'));
        });
    }

    // --- ④ 初期化処理 ---
    updateToggleButtonLabel();
    updateCivilizationControls();
    toggleCostInputs();
    togglePowerInputs();

    // --- ⑤ モーダル機能 (変更なし) ---
    // (中略)
    const cardGrid = document.querySelector('.card-grid');
    const modal = document.getElementById('card-modal');
    if (!cardGrid || !modal) return;

    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalCardName = document.getElementById('modal-card-name');
    const modalCardImage = document.getElementById('modal-card-image');
    const modalCardType = document.getElementById('modal-card-type');
    const modalCivilization = document.getElementById('modal-civilization');
    const modalRarity = document.getElementById('modal-rarity');
    const modalPower = document.getElementById('modal-power');
    const modalCost = document.getElementById('modal-cost');
    const modalMana = document.getElementById('modal-mana');
    const modalRace = document.getElementById('modal-race');
    const modalIllustrator = document.getElementById('modal-illustrator');
    const modalText = document.getElementById('modal-text');

    cardGrid.addEventListener('click', (e) => {
        const cardImage = e.target.closest('.card-image-item');
        if (!cardImage) return;

        const cardId = cardImage.dataset.cardId;
        if (!cardId) return;

        fetch(`get_card_details.php?id=${cardId}`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    console.error('API Error:', data.error);
                    return;
                }
                
                modalCardName.textContent = data.card_name || '---';
                modalCardImage.src = data.modelnum ? `card/${data.modelnum}.webp` : 'path/to/placeholder.webp';
                modalCardImage.alt = data.card_name || 'カード画像';
                modalCardType.textContent = data.card_type || '---';
                modalCivilization.textContent = data.civilization || '---';
                modalRarity.textContent = data.rarity || '---';
                modalPower.textContent = data.pow || '---';
                modalCost.textContent = data.cost || '---';
                modalMana.textContent = data.mana || '---';
                modalRace.textContent = data.race || '---';
                modalIllustrator.textContent = data.illustrator || '---';
                modalText.innerHTML = data.text || '（テキスト情報なし）';

                modal.style.display = 'flex';
            })
            .catch(error => {
                console.error('Fetch Error:', error);
            });
    });

    const closeModal = () => modal.style.display = 'none';

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
            closeModal();
        }
    });
});
