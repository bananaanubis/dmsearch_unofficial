// === ページの読み込み完了後に実行される処理 ===
document.addEventListener('DOMContentLoaded', () => {

    // --- ① 操作する要素をまとめて取得 ---
    const searchForm = document.getElementById('searchForm');
    const resetBtn = document.getElementById('resetBtn');
    const toggleAdvancedBtn = document.getElementById('toggle-advanced-btn');
    const advancedSearchArea = document.getElementById('advanced-search-area');
    const advancedStateInput = document.getElementById('advanced-state');
    const toggleBtn = document.getElementById('toggleBtn');
    const searchCheckboxes = document.querySelectorAll('.checkbox-container input[type="checkbox"]');
    const monoColorBtn = document.querySelector('[data-target-input="mono_color"]');
    const multiColorBtn = document.querySelector('[data-target-input="multi_color"]');
    const mainCivButtons = document.querySelectorAll('#main-civs-buttons .civ-btn');
    const excludeSection = document.getElementById('exclude-civs-section');
    const excludeCivWrappers = document.querySelectorAll('.exclude-civ-wrapper');
    const costMinInput = document.getElementById('cost_min_input');
    const costMaxInput = document.getElementById('cost_max_input');
    const costZeroCheck = document.getElementById('cost_zero_check');
    const costInfinityCheck = document.getElementById('cost_infinity_check');
    const powMinInput = document.getElementById('pow_min_input');
    const powMaxInput = document.getElementById('pow_max_input');
    const powInfinityCheck = document.getElementById('pow_infinity_check');
    const goodsTypeSelect = document.querySelector('select[name="goodstype_id_filter"]');
    const goodsSelect = document.querySelector('select[name="goods_id_filter"]');
    const sortOrderSelect = document.getElementById('sort-order');
    const sortOrderHiddenInput = document.getElementById('sort-order-hidden');
    const cardGrid = document.querySelector('.card-grid');
    const modal = document.getElementById('card-modal');

    // --- ② 状態更新のための共通関数 ---
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
    function updateCivilizationControls() {
        if (!multiColorBtn || !mainCivButtons || !excludeSection) return;
        const isMultiOn = !multiColorBtn.classList.contains('is-off');
        const isAnyMainCivOnExcludingColorless = [...mainCivButtons].some(btn => !btn.classList.contains('is-off') && btn.dataset.civId !== '6');
        excludeSection.style.display = (isMultiOn && isAnyMainCivOnExcludingColorless) ? 'block' : 'none';
        
        const mainCivStatus = {};
        mainCivButtons.forEach(btn => { mainCivStatus[btn.dataset.civId] = !btn.classList.contains('is-off'); });
        excludeCivWrappers.forEach(wrapper => {
            const civId = wrapper.id.replace('exclude-wrapper-', '');
            wrapper.style.display = mainCivStatus[civId] ? 'none' : 'block';
        });
    }
    const updateToggleButtonLabel = () => {
        if (!toggleBtn || !searchCheckboxes) return;
        const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
        toggleBtn.textContent = anyChecked ? '全解除' : '全選択';
    };

    // --- ③ イベントリスナーの設定 ---
    
    // 詳細検索エリアの開閉
    if (toggleAdvancedBtn && advancedSearchArea && advancedStateInput) {
        toggleAdvancedBtn.addEventListener('click', () => {
            const isOpen = advancedSearchArea.classList.toggle('is-open');
            toggleAdvancedBtn.textContent = isOpen ? '条件を隠す' : 'さらに条件をしぼる';
            advancedStateInput.value = isOpen ? '1' : '0';
        });
    }

    // 商品リストの連動
    if (goodsTypeSelect && goodsSelect) {
        goodsTypeSelect.addEventListener('change', () => {
            fetch(`api.php?type=goods&goodstype_id=${goodsTypeSelect.value}`).then(r => r.json()).then(data => {
                goodsSelect.innerHTML = '<option value="0">指定なし</option>';
                data.forEach(goods => { goodsSelect.appendChild(new Option(goods.name, goods.id)); });
            }).catch(e => console.error("Fetch goods error:", e));
        });
    }

    // コストチェックボックスの排他制御
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
    
    // パワーチェックボックス
    if (powInfinityCheck) {
        powInfinityCheck.addEventListener('change', togglePowerInputs);
    }
    
    // ★★★ 文明ボタンのクリックイベントリスナー ★★★
    if (searchForm) {
        searchForm.addEventListener('click', (e) => {
            const button = e.target.closest('.civ-btn');
            if (!button) return; // civ-btn以外は無視

            // イベントがボタン自身から発生した場合のみ処理
            e.preventDefault();

            if (monoColorBtn && multiColorBtn) {
                const isTurningOff = !button.classList.contains('is-off');
                if (button === monoColorBtn && isTurningOff && multiColorBtn.classList.contains('is-off')) return;
                if (button === multiColorBtn && isTurningOff && monoColorBtn.classList.contains('is-off')) return;
            }

            const targetInput = document.getElementById(button.dataset.targetInput);
            if (targetInput) {
                button.classList.toggle('is-off');
                targetInput.value = button.classList.contains('is-off') ? '0' : (button.dataset.civId || '1');
            }
            updateCivilizationControls();
        });
    }
    
    // 並び替え
    if (sortOrderSelect && sortOrderHiddenInput && searchForm) {
        sortOrderSelect.addEventListener('change', () => {
            sortOrderHiddenInput.value = sortOrderSelect.value;
            searchForm.submit();
        });
    }
    
    // 検索対象の全選択/全解除
    if (toggleBtn && searchCheckboxes) {
        toggleBtn.addEventListener('click', () => {
            const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
            searchCheckboxes.forEach(cb => cb.checked = !anyChecked);
            updateToggleButtonLabel();
        });
        searchCheckboxes.forEach(cb => cb.addEventListener('change', updateToggleButtonLabel));
    }
    
    // ★★★★★ リセットボタン処理の完全な再実装 ★★★★★
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            
            // 1. テキストと数値入力をクリア
            const searchInput = document.querySelector('input[name="search"]');
            if (searchInput) searchInput.value = "";
            ['cost_min', 'cost_max', 'pow_min', 'pow_max', 'year_min', 'year_max'].forEach(name => {
                const el = document.querySelector(`input[name="${name}"]`);
                if (el) el.value = "";
            });

            // 2. チェックボックスを全てfalseに
            ['cost_zero', 'cost_infinity', 'pow_infinity'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = false;
            });

            // 3. 検索対象チェックボックスをデフォルトに
            if (searchCheckboxes) {
                document.querySelector('input[name="search_name"]').checked = true;
                document.querySelector('input[name="search_reading"]').checked = true;
                document.querySelector('input[name="search_text"]').checked = true;
                document.querySelector('input[name="search_race"]').checked = false;
                document.querySelector('input[name="search_flavortext"]').checked = false;
                document.querySelector('input[name="search_illus"]').checked = false;
            }

            // 4. ドロップダウンをデフォルトに
            document.querySelectorAll('select.styled-select').forEach(select => {
                const name = select.name;
                if (name === 'mana_filter') select.value = 'all';
                else if (select.id === 'sort-order') select.value = 'release_new';
                else select.value = '0';
            });
            if (sortOrderHiddenInput) sortOrderHiddenInput.value = 'release_new';

            // 5. 文明ボタンをデフォルトに
            if (mainCivButtons) {
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
            }

            // 6. 最後に、全てのUI状態更新関数を呼び出して表示を完全に同期
            updateToggleButtonLabel();
            toggleCostInputs(); // これでテキストボックスが有効になる
            togglePowerInputs();
            updateCivilizationControls();

            // 7. 商品リストをリセット
            if (goodsTypeSelect) goodsTypeSelect.dispatchEvent(new Event('change'));
        });
    }

    // --- ④ 初期化処理 ---
    // ページ読み込み時に各UIを正しい状態に設定
    updateToggleButtonLabel();
    updateCivilizationControls();
    toggleCostInputs();
    togglePowerInputs();

    // --- ⑤ モーダル機能 (変更なし) ---
    if (cardGrid && modal) {
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
            fetch(`get_card_details.php?id=${cardId}`).then(r => r.json()).then(data => {
                if (data.error) { console.error('API Error:', data.error); return; }
                if(modalCardName) modalCardName.textContent = data.card_name || '---';
                if(modalCardImage) {
                    modalCardImage.src = data.modelnum ? `card/${data.modelnum}.webp` : 'path/to/placeholder.webp';
                    modalCardImage.alt = data.card_name || 'カード画像';
                }
                if(modalCardType) modalCardType.textContent = data.card_type || '---';
                if(modalCivilization) modalCivilization.textContent = data.civilization || '---';
                if(modalRarity) modalRarity.textContent = data.rarity || '---';
                if(modalPower) modalPower.textContent = data.pow || '---';
                if(modalCost) modalCost.textContent = data.cost || '---';
                if(modalMana) modalMana.textContent = data.mana || '---';
                if(modalRace) modalRace.textContent = data.race || '---';
                if(modalIllustrator) modalIllustrator.textContent = data.illustrator || '---';
                if(modalText) modalText.innerHTML = data.text || '（テキスト情報なし）';
                modal.style.display = 'flex';
            }).catch(error => console.error('Fetch Error:', error));
        });

        const closeModal = () => modal.style.display = 'none';
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.style.display !== 'none') closeModal(); });
    }
});
