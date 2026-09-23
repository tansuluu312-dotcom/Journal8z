// Конфигурация базы Firebase
const firebaseConfig = {
    databaseURL: "https://journal-8z-default-rtdb.europe-west1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Обновленный список 8З класса
const students = [
    "Абдраманов Нурислам",
    "Акунжанова Арина",
    "Акунов Азирет Али",
    "Ахмедова Элиф",
    "Осмонов Адахан",
    "Байдаалыев Али",
    "Востров Константин",
    "Джаныбеков Баяман",
    "Жумабекова Фатима",
    "Замирбекова Тансулуу",
    "Казыбеков Дамир",
    "Каныбекова Акинай",
    "Кирка Илья",
    "Колмурсаева Аруужан",
    "Конушбаева Мээрим",
    "Кочконбаев Байдөөлөт",
    "Кушалиев Азирет",
    "Кыдыралиев Тариэл",
    "Кылычбекова Мүрөк",
    "Майдинов Анвар",
    "Машаев Айдар",
    "Момуева Айдинай",
    "Мустафаев Амир",
    "Осмонова Афелия",
    "Петров Руслан",
    "Рафатов Нурислам",
    "Рафатов Ясин",
    "Раханов Байхан",
    "Самыйбеков Байэл",
    "Сүйүндүкова Батыйна",
    "Тыныбеков Алиаскар",
    "Шааболотова Амина",
    "Шаршенбекова Сабина",
    "Эркинова Раяна",
    "Эрмеков Жусуп"
];

const totalLessons = 7;
const datePicker = document.getElementById('datePicker');
const studentsList = document.getElementById('studentsList');
const searchInput = document.getElementById('searchInput');

// Проверка режима "Только чтение" по ссылке (?view=readonly)
const urlParams = new URLSearchParams(window.location.search);
const isReadOnly = urlParams.get('view') === 'readonly';

let activeFilter = 'all'; 
let currentDayData = {};

datePicker.valueAsDate = new Date();

if (isReadOnly) {
    document.querySelectorAll('.editor-only').forEach(el => el.style.display = 'none');
    document.getElementById('readonlyBadge').style.display = 'block';
}

function initSync() {
    db.ref('attendance/' + datePicker.value).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentDayData = data;
        } else {
            currentDayData = {};
            students.forEach(name => {
                currentDayData[name] = Array(totalLessons).fill('Б');
            });
        }
        render();
    });
}

function saveData() {
    if (isReadOnly) return;
    db.ref('attendance/' + datePicker.value).set(currentDayData);
}

function setQuickFilter(type) {
    activeFilter = type;
    const buttons = document.querySelectorAll('.tag-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (type === 'all') buttons[0].classList.add('active');
    if (type === 'Н/Б') buttons[1].classList.add('active');
    if (type === 'П') buttons[2].classList.add('active');

    render();
}

function render() {
    studentsList.innerHTML = '';
    const searchQuery = searchInput.value.toLowerCase().trim();

    students.forEach((name) => {
        const studentData = currentDayData[name] || Array(totalLessons).fill('Б');
        
        let absentCount = 0;
        let reasonCount = 0;

        studentData.forEach(st => {
            if (st === 'Н/Б') absentCount++;
            if (st === 'П') reasonCount++;
        });

        if (activeFilter === 'Н/Б' && absentCount === 0) return;
        if (activeFilter === 'П' && reasonCount === 0) return;
        if (searchQuery && !name.toLowerCase().includes(searchQuery)) return;

        const card = document.createElement('div');
        card.className = 'student-card';

        let lessonsHTML = '';
        studentData.forEach((status, lessonIndex) => {
            let btnClass = 'btn-present';
            if (status === 'Н/Б') btnClass = 'btn-absent';
            if (status === 'П') btnClass = 'btn-reason';

            lessonsHTML += `
                <div class="lesson-box">
                    <span class="lesson-title">${lessonIndex + 1} ур</span>
                    <button class="btn-status ${btnClass}" ${isReadOnly ? 'disabled' : ''} onclick="toggleStatus('${name}', ${lessonIndex})">
                        ${status}
                    </button>
                </div>
            `;
        });

        let countText = `Н/Б: ${absentCount}`;
        if (reasonCount > 0) countText += ` | П: ${reasonCount}`;

        card.innerHTML = `
            <div class="student-info">
                <span class="student-name">${name}</span>
                <span class="absent-badge">${countText}</span>
            </div>
            <div class="lessons-grid">${lessonsHTML}</div>
        `;
        studentsList.appendChild(card);
    });
}

function toggleStatus(name, lessonIndex) {
    if (isReadOnly) return;
    if (!currentDayData[name]) currentDayData[name] = Array(totalLessons).fill('Б');
    
    const current = currentDayData[name][lessonIndex];
    if (current === 'Б') currentDayData[name][lessonIndex] = 'Н/Б';
    else if (current === 'Н/Б') currentDayData[name][lessonIndex] = 'П';
    else currentDayData[name][lessonIndex] = 'Б';

    saveData();
}

function markAllPresent() {
    if (isReadOnly) return;
    students.forEach(name => {
        currentDayData[name] = Array(totalLessons).fill('Б');
    });
    saveData();
}

function copyWhatsAppReport() {
    const formattedDate = datePicker.value.split('-').reverse().join('.');
    let report = `📋 *Отсутствующие на ${formattedDate} (8З класс):*\n\n`;
    let hasAbsent = false;

    students.forEach((name, idx) => {
        const studentData = currentDayData[name] || Array(totalLessons).fill('Б');
        const abs = [];
        studentData.forEach((st, i) => {
            if (st !== 'Б') abs.push(`${i + 1}ур(${st})`);
        });

        if (abs.length > 0) {
            hasAbsent = true;
            report += `${idx + 1}. ${name} — ${abs.join(', ')}\n`;
        }
    });

    if (!hasAbsent) report += "Все ученики присутствуют! 🎉";

    navigator.clipboard.writeText(report).then(() => {
        alert("Отчет скопирован в буфер обмена!");
    });
}

function exportToExcel() {
    const rows = [["Ученик", "1 урок", "2 урок", "3 урок", "4 урок", "5 урок", "6 урок", "7 урок"]];

    students.forEach(name => {
        const studentData = currentDayData[name] || Array(totalLessons).fill('Б');
        rows.push([name, ...studentData]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Посещаемость");
    XLSX.writeFile(wb, `Посещаемость_8З_${datePicker.value}.xlsx`);
}

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeBtn');
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        btn.textContent = '🌙';
    } else {
        body.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
    }
}

datePicker.addEventListener('change', initSync);
initSync();
