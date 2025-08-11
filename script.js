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

    // --- ③ イベントリスナーの設定 ---
    
    // 詳細検索エリアの表示/非表示を切り替えるイベント
    if (toggleAdvancedBtn && advancedSearchArea && advancedStateInput) {
        toggleAdvancedBtn.addEventListener('click', () => {
            const isOpen = advancedSearchArea.classList.contains('is-open');
            advancedSearchArea.classList.toggle('is-open', !isOpen);
            toggleAdvancedBtn.textContent = isOpen ? 'さらに条件をしぼる' : '条件を隠す';
            advancedStateInput.value = isOpen ? '0' : '1';
        });
    }

    // 商品の種類と商品名の連動イベント
    if (goodsTypeSelect && goodsSelect) {
        goodsTypeSelect.addEventListener('change', () => {
            const selectedGoodsTypeId = goodsTypeSelect.value;
            fetch(`api.php?type=goods&goodstype_id=${selectedGoodsTypeId}`)
                .then(response => response.json())
                .then(data => {
                    goodsSelect.innerHTML = '<option value="0">指定なし</option>';
                    data.forEach(goods => {
                        const option = document.createElement('option');
                        option.value = goods.id;
                        option.textContent = goods.name;
                        goodsSelect.appendChild(option);
                    });
                });
        });
    }
    
    // コストなし/コスト無限チェックボックスの連動機能
    if (costZeroCheck && costInfinityCheck) {
        costZeroCheck.addEventListener('change', () => {
            if (costZeroCheck.checked) costInfinityCheck.checked = false;
            toggleCostInputs();
        });
        costInfinityCheck.addEventListener('change', () => {
            if (costInfinityCheck.checked) costZeroCheck.checked = false;
            toggleCostInputs();
        });
    }
    
    // パワー無限チェックボックスの連動機能
    if (powInfinityCheck) {
        powInfinityCheck.addEventListener('change', togglePowerInputs);
    }

    // 文明ボタンのクリックイベント
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
    
    // 並び替えが変更されたら、隠しフィールドを更新してフォームを送信
    if (sortOrderSelect && sortOrderHiddenInput && searchForm) {
        sortOrderSelect.addEventListener('change', () => {
            sortOrderHiddenInput.value = sortOrderSelect.value;
            searchForm.submit();
        });
    }

    // チェックボックス関連の関数とイベント
    const updateToggleButtonLabel = () => {
        if (!toggleBtn) return;
        const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
        toggleBtn.textContent = anyChecked ? '全解除' : '全選択';
    };
    const toggleCheckboxes = () => {
        const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
        searchCheckboxes.forEach(cb => cb.checked = !anyChecked);
        updateToggleButtonLabel();
    };
    if (toggleBtn) toggleBtn.addEventListener('click', toggleCheckboxes);
    searchCheckboxes.forEach(cb => cb.addEventListener('change', updateToggleButtonLabel));

    // リセットボタン
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // テキスト入力
            const searchInput = document.querySelector('input[name="search"]');
            if (searchInput) searchInput.value = "";
            
            // 数値入力
            ['cost_min', 'cost_max', 'pow_min', 'pow_max', 'year_min', 'year_max'].forEach(name => {
                const el = document.querySelector(`input[name="${name}"]`);
                if(el) el.value = "";
            });

            // チェックボックス (コスト・パワー)
            ['cost_zero', 'cost_infinity', 'pow_infinity'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.checked = false;
            });

            // ドロップダウン (並び替え含む)
            document.querySelectorAll('select.styled-select').forEach(select => {
                const defaultOption = select.querySelector('option[value="0"], option[value="all"], option[value="release_new"]');
                if (defaultOption) {
                    select.value = defaultOption.value;
                }
            });
            // 隠しフィールドもリセット
            if (sortOrderHiddenInput) sortOrderHiddenInput.value = 'release_new';
            
            // 検索対象チェックボックス (デフォルト状態)
            document.querySelector('input[name="search_name"]').checked = true;
            document.querySelector('input[name="search_reading"]').checked = true;
            document.querySelector('input[name="search_text"]').checked = true;
            document.querySelector('input[name="search_race"]').checked = false;
            document.querySelector('input[name="search_flavortext"]').checked = false;
            document.querySelector('input[name="search_illus"]').checked = false;

            // 文明ボタン (デフォルト状態)
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

            // ★★★ すべての状態更新関数を呼び出す ★★★
            updateToggleButtonLabel();
            updateCivilizationControls();
            toggleCostInputs();
            togglePowerInputs();
            
            // 商品リストをリセットするためにchangeイベントを発火
            if (goodsTypeSelect) goodsTypeSelect.dispatchEvent(new Event('change'));
        });
    }

    // --- ④ 初期化処理 ---
    updateToggleButtonLabel();
    updateCivilizationControls();
    toggleCostInputs();
    togglePowerInputs();

    // --- ⑤ モーダル機能 (変更なし) ---
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
