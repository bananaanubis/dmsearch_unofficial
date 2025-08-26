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
    const showSameNameCheck = document.getElementById('show-same-name-check');

    // --- ② メインの制御関数 ---
    function updateCivilizationControls() {
        if (!multiColorBtn || mainCivButtons.length === 0) return;
        const isMultiOn = !multiColorBtn.classList.contains('is-off');
        const isAnyMainCivOnExcludingColorless = [...mainCivButtons].some(btn => !btn.classList.contains('is-off') && btn.dataset.civId !== '6');
        if (excludeSection) {
            excludeSection.style.display = (isMultiOn && isAnyMainCivOnExcludingColorless) ? 'block' : 'none';
        }
        const mainCivStatus = {};
        mainCivButtons.forEach(btn => { mainCivStatus[btn.dataset.civId] = !btn.classList.contains('is-off'); });
        excludeCivWrappers.forEach(wrapper => {
            const civId = wrapper.id.replace('exclude-wrapper-', '');
            wrapper.style.display = mainCivStatus[civId] === false ? 'block' : 'none';
        });
    }

    // --- ③ イベントリスナーの設定 (リセットボタン以外) ---
    if (toggleAdvancedBtn) {
        toggleAdvancedBtn.addEventListener('click', () => {
            const isOpen = advancedSearchArea.classList.toggle('is-open');
            toggleAdvancedBtn.textContent = isOpen ? '条件を隠す' : 'さらに条件をしぼる';
            if(advancedStateInput) advancedStateInput.value = isOpen ? '1' : '0';
        });
    }
    if (goodsTypeSelect) {
        goodsTypeSelect.addEventListener('change', () => {
            fetch(`api.php?type=goods&goodstype_id=${goodsTypeSelect.value}`)
                .then(response => response.json())
                .then(data => {
                    if (goodsSelect) {
                        goodsSelect.innerHTML = '<option value="0">指定なし</option>';
                        data.forEach(goods => { goodsSelect.add(new Option(goods.name, goods.id)); });
                    }
                });
        });
    }
    const setupCheckboxToggle = (check1, check2, input1, input2) => {
        const toggleInputs = () => {
            const disable = check1.checked || (check2 && check2.checked);
            if(input1) input1.disabled = disable;
            if(input2) input2.disabled = disable;
            if (disable) {
                if(input1) input1.value = '';
                if(input2) input2.value = '';
            }
        };
        check1.addEventListener('change', () => {
            if (check1.checked && check2) check2.checked = false;
            toggleInputs();
        });
        if (check2) {
            check2.addEventListener('change', () => {
                if (check2.checked) check1.checked = false;
                toggleInputs();
            });
        }
        toggleInputs();
    };
    if (costZeroCheck && costInfinityCheck && costMinInput && costMaxInput) {
        setupCheckboxToggle(costZeroCheck, costInfinityCheck, costMinInput, costMaxInput);
    }
    if (powInfinityCheck && powMinInput && powMaxInput) {
        setupCheckboxToggle(powInfinityCheck, null, powMinInput, powMaxInput);
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
            if (sortOrderHiddenInput) sortOrderHiddenInput.value = sortOrderSelect.value;
            if (searchForm) searchForm.submit();
        });
    }
    function updateToggleButtonLabel() {
        if (!toggleBtn) return;
        toggleBtn.textContent = [...searchCheckboxes].some(cb => cb.checked) ? '全解除' : '全選択';
    }
    function toggleCheckboxes() {
        const anyChecked = [...searchCheckboxes].some(cb => cb.checked);
        searchCheckboxes.forEach(cb => cb.checked = !anyChecked);
        updateToggleButtonLabel();
    }
    if (toggleBtn) toggleBtn.addEventListener('click', toggleCheckboxes);
    searchCheckboxes.forEach(cb => cb.addEventListener('change', updateToggleButtonLabel));
    // 同名カード表示チェックボックスが変更されたら、フォームを送信
    if (showSameNameCheck && searchForm) {
        showSameNameCheck.addEventListener('change', () => {
            searchForm.submit();
        });
    }
    // --- ④ リセットボタンのイベントリスナー (安定版) ---
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

        // 発売年
        const yearMinInput = document.querySelector('input[name="year_min"]');
        const yearMaxInput = document.querySelector('input[name="year_max"]');
        if (yearMinInput) yearMinInput.value = "";
        if (yearMaxInput) yearMaxInput.value = "";

        // ドロップダウン
        document.querySelectorAll('select.styled-select').forEach(select => {
             const name = select.name;
             if (name === 'mana_filter') select.value = 'all';
             else if (select.id === 'sort-order') select.value = 'release_new';
             else select.value = '0';
        });
        if(sortOrderHiddenInput) sortOrderHiddenInput.value = 'release_new';

        // 商品名リストの連動機能をトリガー
        if (goodsTypeSelect) {
            goodsTypeSelect.dispatchEvent(new Event('change'));
        }

        // 検索対象チェックボックス
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

        // 最後にUIの状態を更新
        updateCivilizationControls();
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSearch);
    }
    
    // --- ⑤ 初期化処理 ---
    updateToggleButtonLabel();
    updateCivilizationControls();

    // --- ⑥ モーダル機能 ---
    const cardGrid = document.querySelector('.card-grid');
    const modal = document.getElementById('card-modal');
    if (cardGrid && modal) {
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const modalOverlay = document.querySelector('.modal-overlay');
        const modalCardName = document.getElementById('modal-card-name');
        const modalCardsContainer = document.getElementById('modal-cards-container');
        const modalCardTemplate = document.getElementById('modal-card-template');

        let scrollTimeout;
        const updateModalHeaderOnScroll = () => {
            const cardInstances = modalCardsContainer.querySelectorAll('.modal-card-instance');
            if (cardInstances.length <= 1) return;
            let topVisibleCardName = '';
            for (const instance of cardInstances) {
                const rect = instance.getBoundingClientRect();
                const modalRect = modalCardsContainer.getBoundingClientRect();
                if (rect.top >= modalRect.top && rect.top < modalRect.bottom) {
                    topVisibleCardName = instance.dataset.cardName;
                    break;
                }
            }
            if (topVisibleCardName) {
                modalCardName.textContent = topVisibleCardName;
            }
        };

        modalCardsContainer.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateModalHeaderOnScroll, 50);
        });

        cardGrid.addEventListener('click', (e) => {
            const cardImage = e.target.closest('.card-image-item');
            if (!cardImage) return;
            const cardId = cardImage.dataset.cardId;
            if (!cardId) return;
            
            modalCardsContainer.innerHTML = ''; 
            modalCardName.textContent = '読み込み中...';
            modal.style.display = 'flex';

            fetch(`get_card_details.php?id=${cardId}`)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    if (data.error || !data.cards || data.cards.length === 0) {
                        console.error('API Error:', data.error || 'No cards found');
                        modalCardName.textContent = 'エラー';
                        modalCardsContainer.innerHTML = '<p style="text-align:center;">カード情報の取得に失敗しました。</p>';
                        return;
                    }
                    
                    modalCardName.textContent = data.set_name || data.cards[0].card_name;

                    data.cards.forEach((cardInfo, index) => {
                        const templateClone = modalCardTemplate.content.cloneNode(true);
                        const cardInstance = templateClone.querySelector('.modal-card-instance');
                        cardInstance.dataset.cardName = cardInfo.card_name;

                        const part = String.fromCharCode(97 + index);

                        templateClone.querySelector('.modal-card-type').textContent = cardInfo.card_type;
                        templateClone.querySelector('.modal-civilization').textContent = cardInfo.civilization;
                        templateClone.querySelector('.modal-rarity').textContent = cardInfo.rarity;
                        templateClone.querySelector('.modal-power').textContent = (cardInfo.pow == 2147483647) ? '∞' : (cardInfo.pow ?? '---');
                        templateClone.querySelector('.modal-cost').textContent = (cardInfo.cost == 2147483647) ? '∞' : (cardInfo.cost ?? '---');
                        templateClone.querySelector('.modal-mana').textContent = cardInfo.mana ?? '---';
                        templateClone.querySelector('.modal-race').textContent = cardInfo.race;
                        templateClone.querySelector('.modal-illustrator').textContent = cardInfo.illustrator;

                        let imageUrl = `card/${cardInfo.modelnum}.webp`;
                        if (data.is_set && data.image_urls && data.image_urls[part]) {
                            imageUrl = data.image_urls[part];
                        }
                        templateClone.querySelector('.modal-card-image').src = imageUrl;
                        templateClone.querySelector('.modal-card-image').alt = cardInfo.card_name;
                        
                        const textSection = templateClone.querySelector('.modal-ability-section');
                        let abilityText = data.is_set ? 
                            ((data.texts && data.texts[part]) ? formatAbilityText(data.texts[part]) : '（テキスト情報なし）') : 
                            cardInfo.text;
                        if (abilityText && abilityText !== '（テキスト情報なし）') {
                            templateClone.querySelector('.modal-text').innerHTML = abilityText;
                            textSection.style.display = 'block';
                        }

                        const flavorSection = templateClone.querySelector('.modal-flavor-section');
                        let flavorText = data.is_set ? 
                            ((data.flavortexts && data.flavortexts[part]) ? formatFlavorText(data.flavortexts[part]) : null) :
                            cardInfo.flavortext;
                        if (flavorText) {
                            templateClone.querySelector('.modal-flavortext').innerHTML = flavorText;
                            flavorSection.style.display = 'block';
                        }
                        
                        modalCardsContainer.appendChild(templateClone);
                    });

                    if (data.is_set && data.cards.length > 0) {
                        modalCardName.textContent = data.cards[0].card_name;
                    }
                })
                .catch(error => {
                    console.error('Fetch Error:', error);
                    modalCardName.textContent = 'エラー';
                    modalCardsContainer.innerHTML = '<p style="text-align:center;">通信エラーが発生しました。</p>';
                });
        });

        function formatAbilityText(rawText) {
            if (!rawText || rawText.trim() === '') return '（テキスト情報なし）';
            
            const iconMap = {
                '{ST}': '<img src="parts/card_list_strigger.webp" class="text-icon">',
                '{BR}': '<img src="parts/card_list_block.webp" class="text-icon">',
                '{SV}': '<img src="parts/card_list_survivor.webp" class="text-icon">',
                '{TT}': '<img src="parts/card_list_taptrigger.webp" class="text-icon">',
                '{TR}': '<img src="parts/card_list_turborush.webp" class="text-icon">'
            };
            const iconTags = Object.keys(iconMap);
        
            return rawText.split('\n').map(line => {
                let trimmed = line.trim();
                if (trimmed === '') return null;
                
                // 1. 各種フラグをチェック
                const isIndented = trimmed.startsWith('{TAB}');
                if (isIndented) {
                    trimmed = trimmed.substring(5).trim();
                }
        
                const startsWithIcon = iconTags.some(tag => trimmed.startsWith(tag));
                const isParenthetical = trimmed.startsWith('(') && trimmed.endsWith(')');
        
                // 2. HTMLエスケープとアイコン置換
                let processedLine = trimmed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                for (const tag of iconTags) {
                    processedLine = processedLine.replace(new RegExp(tag.replace(/\{/g, '\\{').replace(/\}/g, '\\}'), 'g'), iconMap[tag]);
                }
                
                // 3. 行頭記号と字下げクラスを決定
                let prefix = '';
                let wrapperClass = '';
        
                if (isIndented) {
                    wrapperClass = ' class="indented-text"';
                    if (!startsWithIcon) {
                        prefix = '▶ ';
                    }
                } else if (!startsWithIcon && !isParenthetical) {
                    prefix = '■ ';
                }
        
                // 4. 最終的なHTMLを組み立てる
                return `<span${wrapperClass}>${prefix}${processedLine}</span>`;
        
            }).filter(line => line !== null).join('<br>');
        }
        function formatFlavorText(rawText) {
             if (!rawText || rawText.trim() === '') return null;
             const escaped = rawText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
             return escaped.replace(/\n/g, '<br>');
        }

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
});
