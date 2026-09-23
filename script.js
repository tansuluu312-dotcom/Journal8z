// 1. Конфигурация Firebase с твоими реальными ключами
const firebaseConfig = {
    apiKey: "AIzaSyCRSsm0to4ZY6Y9nyWEA8D0L6zcuDSbAPs",
    authDomain: "journal-8z.firebaseapp.com",
    databaseURL: "https://journal-8z-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "journal-8z",
    storageBucket: "journal-8z.firebasestorage.app",
    messagingSenderId: "3821431182",
    appId: "1:3821431182:web:ea8a16b6533293b2f41cdf",
    measurementId: "G-65KDG0ZEMN"
};

let db = null;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();
    }
} catch (e) {
    console.warn("Firebase оффлайн режим", e);
}

// 2. Полный список класса 8-З
const students = [
    "Абдрахман Нурсултан",
    "Абдурасулов Нурислам",
    "Акуналы уулу Азиз",
    "Акунов Азирет-Али",
    "Акунов Алихан",
    "Акылбеков Арсен",
    "Алмазбеков Али",
    "Асадулин Нурсултан",
    "Аширалиева Рабия",
    "Базарбаева Асыл",
    "Байболотов Али",
    "Бектен Константин",
    "Бектуров Алихан",
    "Бектурова Аделя",
    "Догдурбаев Сабыр",
    "Доолотбеков Соорун",
    "Дюшебаева Салия",
    "Жамалбеков Бактияр",
    "Жумабеков Нурсултан",
    "Жумабеков Тынчтык",
    "Жуманалиева Азиза",
    "Замирбеков Актилек",
    "Замирбекова Тамара",
    "Ибраимова Айбийке",
    "Караев Ильяз",
    "Касенбеков Арсен",
    "Кенжебаева Айбике",
    "Кенжебекова Арууке",
    "Кермалиев Нурэл",
    "Ким Юлия",
    "Кочконбаева Арууке",
    "Кубанычева Тансулуу",
    "Кудайбергенов Тарэль",
    "Кудайбергенова Табита",
    "Осмонов Адахан"
];

const totalLessons = 7;
let currentDayData = {};
let currentFilter = 'all';

const datePicker = document.getElementById('datePicker');
const searchInput = document.getElementById('searchInput');
const studentsList = document.getElementById('studentsList');

// Выставляем сегодняшнюю дату
const today = new Date().toISOString().split('T')[0];
if (datePicker) {
    datePicker.value = today;
    datePicker.addEventListener('change', loadData);
}

function getKey() {
    return datePicker ? datePicker.value : today;
}

// Загрузка данных
function loadData() {
    const key = getKey();
    
    const local = localStorage.getItem(`attendance_${key}`);
    if (local) {
        try {
            currentDayData = JSON.parse(local);
        } catch(e) {}
    }
    
    students.forEach(name => {
        if (!currentDayData[name]) {
            currentDayData[name] = Array(totalLessons).fill('Б');
        }
    });
    render();

    if (db) {
        db.ref(`attendance/${key}`).once('value').then(snapshot => {
            const val = snapshot.val();
            if (val) {
                students.forEach(name => {
                    if (val[name] && Array.isArray(val[name])) {
                        currentDayData[name] = val[name];
                    }
                });
                saveLocal();
                render();
            } else {
                db.ref(`attendance/${key}`).set(currentDayData);
            }
        }).catch(() => {});
    }
}

function saveLocal() {
    localStorage.setItem(`attendance_${getKey()}`, JSON.stringify(currentDayData));
}

// Отрисовка списка карточек
function render() {
    if (!studentsList) return;
    studentsList.innerHTML = '';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    students.forEach(name => {
        if (query && !name.toLowerCase().includes(query)) return;

        const userLessons = currentDayData[name] || Array(totalLessons).fill('Б');
        const absentCount = userLessons.filter(s => s !== 'Б').length;

        if (currentFilter === 'absent' && !userLessons.includes('Н/Б')) return;
        if (currentFilter === 'reason' && !userLessons.includes('П')) return;
        if (currentFilter === 'late' && !userLessons.includes('О')) return;

        const card = document.createElement('div');
        card.className = 'student-card';

        let lessonsHTML = '';
        userLessons.forEach((status, i) => {
            let cls = 'btn-present';
            if (status === 'Н/Б') cls = 'btn-absent';
            if (status === 'П') cls = 'btn-reason';
            if (status === 'О') cls = 'btn-late';

            lessonsHTML += `
                <div class="lesson-box">
                    <span class="lesson-title">${i + 1} ур</span>
                    <button class="btn-status ${cls}" onclick="toggleStatus('${name}', ${i})">${status}</button>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="student-info">
                <span class="student-name">${name}</span>
                <span class="absent-count">Отметок: ${absentCount}</span>
            </div>
            <div class="lessons-grid">${lessonsHTML}</div>
        `;
        studentsList.appendChild(card);
    });
}

// Переключение статуса кликом
function toggleStatus(name, index) {
    const cycle = ['Б', 'Н/Б', 'П', 'О'];
    const current = currentDayData[name][index] || 'Б';
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];

    currentDayData[name][index] = next;
    saveLocal();
    render();

    if (db) {
        db.ref(`attendance/${getKey()}/${name}`).set(currentDayData[name]).catch(() => {});
    }
}

// Кнопка "Все есть"
function markAllPresent() {
    students.forEach(name => {
        currentDayData[name] = Array(totalLessons).fill('Б');
    });
    saveLocal();
    render();

    if (db) {
        db.ref(`attendance/${getKey()}`).set(currentDayData).catch(() => {});
    }
}

// Фильтры
function setFilter(type, el) {
    currentFilter = type;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    render();
}

// Отчет WhatsApp
function copyWhatsAppReport() {
    let text = `📅 Отчет по посещаемости на ${getKey()}:\n\n`;
    let hasAbsent = false;

    students.forEach(name => {
        const userLessons = currentDayData[name] || [];
        const absents = userLessons.map((s, i) => (s !== 'Б' ? `${i + 1} ур (${s})` : null)).filter(Boolean);
        if (absents.length > 0) {
            text += `• ${name}: ${absents.join(', ')}\n`;
            hasAbsent = true;
        }
    });

    if (!hasAbsent) text += "Все присутствуют! 🎉";

    navigator.clipboard.writeText(text).then(() => {
        alert("Отчет скопирован в буфер обмена!");
    });
}

// Статистика
function openStats() {
    document.getElementById('statsModal').classList.add('active');
    const statsBody = document.getElementById('statsBody');
    statsBody.innerHTML = 'Загрузка...';

    const currentMonth = getKey().slice(0, 7);
    const stats = {};
    students.forEach(name => stats[name] = 0);

    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(`attendance_${currentMonth}`)) {
            try {
                const dayData = JSON.parse(localStorage.getItem(k));
                students.forEach(name => {
                    if (dayData[name]) {
                        stats[name] += dayData[name].filter(s => s !== 'Б').length;
                    }
                });
            } catch(e) {}
        }
    }

    let html = `<p style="font-weight: bold; margin-bottom: 8px;">Месяц: ${currentMonth}</p>`;
    students.forEach(name => {
        html += `<div class="stat-item"><span>${name}</span> <b>${stats[name]} проп.</b></div>`;
    });
    statsBody.innerHTML = html;
}

function closeStats() {
    document.getElementById('statsModal').classList.remove('active');
}

// Переключение темы
function toggleTheme() {
    const htmlEl = document.documentElement;
    const btn = document.getElementById('themeBtn');
    if (htmlEl.getAttribute('data-theme') === 'dark') {
        htmlEl.removeAttribute('data-theme');
        btn.textContent = '🌙';
    } else {
        htmlEl.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
    }
}

// Запуск при старте
loadData();
