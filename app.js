const themeToggleBtn = document.getElementById('themeToggleBtn');
const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️';
}

themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.textContent = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.textContent = '☀️';
    }
});

let globalData = [];
let filteredData = [];
let filterCondition = {
    year: "all",
    type: "all",
    domain: "all",
    genre: "all",
    difficulty: "all"
};
let qcart = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch('data/exam_data.json');
        const data = await response.json();
        globalData = data.all_data;

        const pathname = window.location.pathname;
        if (pathname.includes('content.html')) {
            initContentPage(); // Content 페이지 초기화
            initCartAside();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// 목록 페이지 초기화
function initContentPage() {
    const allData = globalData.flatMap(item =>
        item.exam_data.map(subItem => ({ exam_year: item.exam_year, exam_type: item.exam_name, ...subItem }))
    );
    filteredData = [...allData]
    renderContent();

    // 필터 - 연도 select
    document.getElementById('filter-year').addEventListener('change', (e) => {
        filterCondition.year = e.target.value;
        handleFilter();
    });

    // 필터 - 월 type 버튼
    document.getElementById('filter-type').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            e.currentTarget.querySelectorAll('button').forEach(btn => btn.classList.remove("active"));
            filterCondition.type = e.target.value;
            e.target.classList.add('active');
            handleFilter();
        }
    });

    // 필터 - 장르 select
    document.getElementById('filter-genre').addEventListener('change', (e) => {
        filterCondition.genre = e.target.value;
        handleFilter();
    });

    // 필터 - 난이도 버튼
    document.getElementById('filter-difficulty').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            e.currentTarget.querySelectorAll('button').forEach(btn => btn.classList.remove("active"));
            e.target.classList.add('active');
            filterCondition.difficulty = e.target.value;
            handleFilter();
        }
    });
};

function handleFilter() {
    const allData = globalData.flatMap(item =>
        item.exam_data.map(subItem => ({ exam_year: item.exam_year, exam_type: item.exam_name, ...subItem }))
    );
    filteredData = allData.filter(item => {
        if (filterCondition.year !== 'all' && item.exam_year !== filterCondition.year) return false;
        if (filterCondition.type !== 'all' && item.exam_type !== filterCondition.type) return false;
        if (filterCondition.domain !== 'all' && item.type !== filterCondition.domain) return false;
        const genreList = [].concat(item.genre);
        if (filterCondition.genre !== 'all' && !genreList.includes(filterCondition.genre)) return false;
        if (filterCondition.difficulty !== 'all' && item.difficulty !== filterCondition.difficulty) return false;
        return true;
    });

    renderContent();
}

// aside 장바구니 초기화
function initCartAside() {
    const cardContainer = document.getElementById('question-list-container');
    const cartList = document.getElementById('cart-list-wrapper');

    cardContainer.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.btn-add');
        if (!addBtn) return;

        const card = addBtn.closest('.question-item');
        const id = card.dataset.id;

        // 이미 담겨있는지 확인
        if (qcart.some(item => item.id === id)) {
            qcart = qcart.filter(item => item.id !== id);

            addBtn.classList.remove('is-added')
            addBtn.textContent = '담기';
        } else {
            qcart.push({
                id: id,
                title: card.querySelector('h4').innerText,
                desc: card.querySelector('.q-meta').innerText.replaceAll('\n', '-')
            });

            addBtn.classList.add('is-added');
            addBtn.textContent = '✓ 담김';
        }

        renderCart();
    });

    cartList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.btn-remove');
        if (!removeBtn) return;

        const cartItem = removeBtn.closest('.cart-item');
        const targetId = cartItem.dataset.id;

        qcart = qcart.filter(item => item.id !== targetId);

        const originalCard = document.querySelector(`.question-item[data-id="${targetId}"]`);
        if (originalCard) {
            const addBtn = originalCard.querySelector('.btn-add');
            addBtn.classList.remove('is-added');
            addBtn.textContent = '담기';
        }

        renderCart();
    });
}

// 목록 렌더링
function renderContent() {
    const listlen = document.getElementById('result-count');
    const card = document.getElementById('question-list-container');
    if (!card) return;
    if (!listlen) return;

    listlen.innerText = '';
    card.innerHTML = '';
    listlen.insertAdjacentText('beforeend', `총 ${filteredData.length}건`)
    card.innerHTML = filteredData.map(item => {
        const isAdded = qcart.some(cartItem => cartItem.id === String(item.id));

        const btnText = isAdded ? '✓ 담김' : '담기';

        return `
        <article class="question-item" data-id="${item.id}">
            <div class="q-info">
                <h4>${item.exam_year} ${item.exam_type} '${item.title}'</h4>
                    <div class="q-meta">
                        <span>${item.genre}</span>
                        <span>${item.questions.length}문제</span>
                        <span>난이도: ${item.difficulty}</span>
                    </div>
            </div>
            <button class="btn-add">${btnText}</button>
        </article>
    `}).join('');
}

// 카트 렌더링
function renderCart() {
    const cartCount = document.getElementById('cart-count');
    const btnGenerate = document.getElementById('btn-generate-exam');
    const cartList = document.getElementById('cart-list-wrapper');

    cartCount.textContent = `${qcart.length}건`;
    btnGenerate.disabled = qcart.length === 0;

    cartList.innerHTML = '';

    if (qcart.length === 0) {
        cartList.innerHTML = `
                    <div class="empty-message" id="cart-empty-msg">
                        아직 담은 지문이 없습니다.
                    </div>
                `;
        return;
    }
    cartList.innerHTML = qcart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-desc">${item.desc}</div>
                    <button class="btn-remove" title="삭제">&times;</button>
                </div>
            `).join('');
}

// 목록 필터 제어 함수
function updateGenreOptions() {
    const domainSelect = document.getElementById('filter-domain');
    const litGroup = document.querySelector('.genre-lit');
    const readGroup = document.querySelector('.genre-read');
    const selectedValue = domainSelect.value;

    if (selectedValue === '문학') {
        litGroup.style.display = '';
        readGroup.style.display = 'none';
    } else if (selectedValue === '독서') {
        litGroup.style.display = 'none';
        readGroup.style.display = '';
    } else {
        litGroup.style.display = '';
        readGroup.style.display = '';
    }

    document.getElementById('filter-genre').value = 'all';
    filterCondition.domain = selectedValue;
    filterCondition.genre = "all";
    handleFilter();
}

function generateExamPaper() {
    document.getElementById('exam-modal').classList.remove('hidden');

    const modalBody = document.getElementById('modal-body-container');
    modalBody.innerHTML = '';

    let questionNumber = 1;
    const allData = globalData.flatMap(item => item.exam_data);
    let rawHtmlString = '';
    let answerKey = [];

    qcart.forEach(cartItem => {
        const passageData = allData.find(item => String(item.id) === cartItem.id);
        if (!passageData) return;

        const startNum = questionNumber;
        const endNum = questionNumber + passageData.questions.length - 1;
        const questionRangeText = passageData.questions.length > 1 ? `[${startNum}~${endNum}]` : `[${startNum}]`;

        rawHtmlString += `
                    <div class="paper-paragraph">
                        <div class="paragraph-title">${questionRangeText} 다음 글을 읽고 물음에 답하시오.</div>
                        <div class="paragraph-box">
                            ${passageData.paragraph}
                        </div>
                    </div>
                `;

        passageData.questions.forEach(q => {
            const ans_ = { "1": '①', "2": '②', "3": '③', "4": '④', "5": '⑤' };
            answerKey.push({
                num: questionNumber,
                ans: ans_[q.answer] || '-',
                score: q.score ? q.score : '-'
            });

            const cleanQuestionText = q.question.replace(/^\d+\.\s*/, '');
            rawHtmlString += `
                        <div class="paper-question">
                            <p class="question-title">
                                <strong>${questionNumber}. ${cleanQuestionText}</strong>
                            </p>
                    `;

            if (q.bogi) {
                const safeBogi = q.bogi.replace(/<보\s*기>/g, '&lt;보 기&gt;');
                rawHtmlString += `
                            <div class="bogi-box">
                                ${safeBogi}
                            </div>
                        `;
            }

            if (q.choices && q.choices.length > 0) {
                rawHtmlString += `<ol class="choices-list">`;
                const circleNumbers = ['①', '②', '③', '④', '⑤'];
                q.choices.forEach((choice, idx) => {
                    rawHtmlString += `
                                <li>
                                    <span style="flex-shrink: 0; font-weight: bold;">${circleNumbers[idx] || (idx + 1)}</span>
                                    <span>${choice}</span>
                                </li>
                            `;
                });
                rawHtmlString += `</ol>`;
            }

            rawHtmlString += `</div>`;
            questionNumber++;
        });
    });

    const measureBoard = document.createElement('div');
    measureBoard.className = 'measure-board';

    const masterColumns = document.createElement('div');
    masterColumns.className = 'master-columns';
    masterColumns.innerHTML = rawHtmlString;

    const stepMeasure = document.createElement('div');
    stepMeasure.style.width = '190mm';

    measureBoard.appendChild(masterColumns);
    measureBoard.appendChild(stepMeasure);
    document.body.appendChild(measureBoard);

    const scrollWidthPx = masterColumns.scrollWidth;
    const stepPx = stepMeasure.getBoundingClientRect().width;

    const totalPages = Math.max(1, Math.ceil(scrollWidthPx / stepPx));

    for (let i = 0; i < totalPages; i++) {
        const page = document.createElement('div');
        page.className = 'a4-paper';

        const title = document.createElement('div');
        title.className = 'paper-title';
        title.innerText = '나만의 국어 모의평가';
        if (i > 0) {
            title.style.visibility = 'hidden';
        }
        page.appendChild(title);

        const windowDiv = document.createElement('div');
        windowDiv.className = 'paper-content-window';

        const clonedMaster = masterColumns.cloneNode(true);

        clonedMaster.style.left = `-${i * 190}mm`;

        windowDiv.appendChild(clonedMaster);
        page.appendChild(windowDiv);

        modalBody.appendChild(page);
    }

    document.body.removeChild(measureBoard);

    if (answerKey.length > 0) {
        const answerPage = document.createElement('div');
        answerPage.className = 'a4-paper';

        const title = document.createElement('div');
        title.className = 'paper-title';
        title.innerText = '정답 및 배점';
        answerPage.appendChild(title);

        const tableContainer = document.createElement('div');
        tableContainer.className = 'score-container';

        let tableHtml = `
                    <table class="score-table">
                        <thead>
                            <tr>
                                <th>문항 번호</th>
                                <th>정답</th>
                                <th>배점</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

        answerKey.forEach(item => {
            tableHtml += `
                        <tr>
                            <td>${item.num}</td>
                            <td>${item.ans}</td>
                            <td>${item.score}</td>
                        </tr>
                    `;
        });

        tableHtml += `
                        </tbody>
                    </table>
                `;

        tableContainer.innerHTML = tableHtml;
        answerPage.appendChild(tableContainer);
        modalBody.appendChild(answerPage);
    }
}