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

    // --- ② メインの制御関数 ---
    function updateCivilizationControls() {
        if (!multiColorBtn || mainCivButtons.length === 0) return;
        const isMultiOn = !multiColorBtn.classList.contains('is-off');
        const isAnyMainCivOnExcludingColorless = [...mainCivButtons].some(btn => {
            const isItOn = !btn.classList.contains('is-off');
            const isItNotColorless = btn.dataset.civId !== '6';
            return isItOn && isItNotColorless;
        });

        if (isMultiOn && isAnyMainCivOnExcludingColorless) {
            if (excludeSection) excludeSection.style.display = 'block';
        } else {
            if (excludeSection) excludeSection.style.display = 'none';
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

    // --- ③ イベントリスナーの設定 (リセットボタン以外) ---
    if (toggleAdvancedBtn && advancedSearchArea && advancedStateInput) {
        toggleAdvancedBtn.addEventListener('click', () => {
            const isOpen = advancedSearchArea.classList.contains('is-open');
            if (isOpen) {
                advancedSearchArea.classList.remove('is-open');
                toggleAdvancedBtn.textContent = 'さらに条件をしぼる';
                advancedStateInput.value = '0';
            } else {
                advancedSearchArea.classList.add('is-open');
                toggleAdvancedBtn.textContent = '条件を隠す';
                advancedStateInput.value = '1';
            }
        });
    }
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
    if (costZeroCheck && costInfinityCheck && costMinInput && costMaxInput) {
        const toggleCostInputs = () => {
            if (costZeroCheck.checked || costInfinityCheck.checked) {
                costMinInput.disabled = true;
                costMaxInput.disabled = true;
                costMinInput.value = '';
                costMaxInput.value = '';
            } else {
                costMinInput.disabled = false;
                costMaxInput.disabled = false;
            }
        };
        costZeroCheck.addEventListener('change', () => {
            if (costZeroCheck.checked) {
                costInfinityCheck.checked = false;
            }
            toggleCostInputs();
        });
        costInfinityCheck.addEventListener('change', () => {
            if (costInfinityCheck.checked) {
                costZeroCheck.checked = false;
            }
            toggleCostInputs();
        });
        toggleCostInputs();
    }
    if (powInfinityCheck && powMinInput && powMaxInput) {
        const togglePowerInputs = () => {
            if (powInfinityCheck.checked) {
                powMinInput.disabled = true;
                powMaxInput.disabled = true;
                powMinInput.value = '';
                powMaxInput.value = '';
            } else {
                powMinInput.disabled = false;
                powMaxInput.disabled = false;
            }
        };
        powInfinityCheck.addEventListener('change', togglePowerInputs);
        togglePowerInputs();
    }
    if (searchForm) {
        searchForm.addEventListener('click', (e) => {
            const button = e.target.closest('.civ-btn');
            if (!button) return;
            const isTurningOff = !button.classList.contains('is-off');
            if (button === monoColorBtn && isTurningOff) {
                if (multiColorBtn.classList.contains('is-off')) return;
            }
            if (button === multiColorBtn && isTurningOff) {
                if (monoColorBtn.classList.contains('is-off')) return;
            }
            const targetInput = document.getElementById(button.dataset.targetInput);
            button.classList.toggle('is-off');
            if (targetInput) {
                targetInput.value = button.classList.contains('is-off') ? '0' : (button.dataset.civId || '1');
            }
            updateCivilizationControls();
        });
    }
    if (sortOrderSelect && sortOrderHiddenInput && searchForm) {
        sortOrderSelect.addEventListener('change', () => {
            sortOrderHiddenInput.value = sortOrderSelect.value;
            searchForm.submit();
        });
    }
    function updateToggleButtonLabel() {
        if (!toggleBtn) return;
        const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
        toggleBtn.textContent = anyChecked ? '全解除' : '全選択';
    }
    function toggleCheckboxes() {
        const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
        searchCheckboxes.forEach(cb => cb.checked = !anyChecked);
        updateToggleButtonLabel();
    }
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCheckboxes);
    }
    searchCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateToggleButtonLabel);
    });

    // --- ④ リセットボタンのイベントリスナー ---
    function resetSearch() {
        // テキスト入力
        const searchInput = document.querySelector('input[name="search"]');
        if (searchInput) searchInput.value = "";

        // コスト
        if (costMinInput) costMinInput.value = "";
        if (costMaxInput) costMaxInput.value = "";
        if (costZeroCheck) costZeroCheck.checked = false;
        if (costInfinityCheck) costInfinityCheck.checked = false;
        if (costMinInput) costMinInput.disabled = false;
        if (costMaxInput) costMaxInput.disabled = false;

        // パワー
        if (powMinInput) powMinInput.value = "";
        if (powMaxInput) powMaxInput.value = "";
        if (powInfinityCheck) powInfinityCheck.checked = false;
        if (powMinInput) powMinInput.disabled = false;
        if (powMaxInput) powMaxInput.disabled = false;

        // ドロップダウン
        document.querySelectorAll('select.styled-select').forEach(select => {
             const name = select.name;
             if (name === 'mana_filter') select.value = 'all';
             else if (select.id === 'sort-order') select.value = 'release_new';
             else select.value = '0';
        });
        if(sortOrderHiddenInput) sortOrderHiddenInput.value = 'release_new';


        if (goodsTypeSelect) {
            goodsTypeSelect.dispatchEvent(new Event('change'));
        }

        // チェックボックス
        const searchName = document.querySelector('input[name="search_name"]');
        const searchReading = document.querySelector('input[name="search_reading"]');
        const searchText = document.querySelector('input[name="search_text"]');
        const searchRace = document.querySelector('input[name="search_race"]');
        const searchFlavortext = document.querySelector('input[name="search_flavortext"]');
        const searchIllus = document.querySelector('input[name="search_illus"]');
        if (searchName) searchName.checked = true;
        if (searchReading) searchReading.checked = true;
        if (searchText) searchText.checked = true;
        if (searchRace) searchRace.checked = false;
        if (searchFlavortext) searchFlavortext.checked = false;
        if (searchIllus) searchIllus.checked = false;
        updateToggleButtonLabel();

        // 文明ボタン
        document.querySelectorAll('.civ-btn').forEach(button => {
            const targetInput = document.getElementById(button.dataset.targetInput);
            const buttonId = button.dataset.targetInput;
            if (buttonId === 'mono_color' || buttonId === 'multi_color') {
                button.classList.remove('is-off');
                if (targetInput) targetInput.value = '1';
            } else {
                button.classList.add('is-off');
                if (targetInput) targetInput.value = '0';
            }
        });

        updateCivilizationControls();
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSearch);
    }
    
    // --- ⑤ モーダル機能 (ここから追加) ---
    const cardGrid = document.querySelector('.card-grid');
    const modal = document.getElementById('card-modal');
    
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
        const modalFlavorSection = document.getElementById('modal-flavor-section');
        const modalFlavortext = document.getElementById('modal-flavortext');

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
                })
                .catch(error => {
                    console.error('Fetch Error:', error);
                });
        });

        const closeModal = () => {
            if (modal) modal.style.display = 'none';
        };

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    // --- ⑥ 初期化処理 ---
    updateToggleButtonLabel();
    updateCivilizationControls();

});
