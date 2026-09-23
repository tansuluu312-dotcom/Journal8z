const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db = null;
try {
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    }
} catch (e) {
    console.warn("Офлайн режим: работаем через localStorage");
}

// Проверка: открыт ли сайт в режиме просмотра для родителей (?mode=view)
const urlParams = new URLSearchParams(window.location.search);
const isParentView = urlParams.get('mode') === 'view';

// Полный список класса (35 человек)
const students = [
    "Абдраманов Нурислам",
    "Акунжанова Арина",
    "Акунов Азирет Али",
    "Ахмедова Элиф",
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
    "Осмонов Адахан",
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

let currentFilter = 'all';
let currentDayData = {};

if (datePicker && !datePicker.value) {
    datePicker.value = new Date().toISOString().split('T')[0];
}

function getKey() {
    return datePicker ? datePicker.value : new Date().toISOString().split('T')[0];
}

function loadFromLocal() {
    const raw = localStorage.getItem(`attendance_${getKey()}`);
    if (raw) {
        try {
            currentDayData = JSON.parse(raw);
            return;
        } catch (e) {}
    }
    currentDayData = {};
    students.forEach(name => {
        currentDayData[name] = Array(totalLessons).fill('Б');
    });
}

function saveToLocal() {
    if (isParentView) return;
    localStorage.setItem(`attendance_${getKey()}`, JSON.stringify(currentDayData));
}

function syncWithFirebase() {
    if (!db) return;
    const key = getKey();
    
    db.ref(`attendance/${key}`).once('value').then(snapshot => {
        const val = snapshot.val();
        if (val) {
            students.forEach(name => {
                if (val[name] && Array.isArray(val[name])) {
                    currentDayData[name] = val[name];
                }
            });
            saveToLocal();
            render();
        } else if (!isParentView) {
            db.ref(`attendance/${key}`).set(currentDayData);
        }
    }).catch(() => {});
}

function render() {
    if (!studentsList) return;
    studentsList.innerHTML = '';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (isParentView) {
        const adminControls = document.querySelectorAll('.admin-only');
        adminControls.forEach(el => el.style.display = 'none');
    }

    students.forEach((name, studentIndex) => {
        if (query && !name.toLowerCase().includes(query)) return;

        const userLessons = currentDayData[name] || Array(totalLessons).fill('Б');
        const absentCount = userLessons.filter(s => s !== 'Б').length;

        if (currentFilter === 'absent' && !userLessons.includes('Н/Б')) return;
        if (currentFilter === 'reason' && !userLessons.includes('П')) return;
        if (currentFilter === 'late' && !userLessons.includes('О')) return;

        const card = document.createElement('div');
        card.className = 'student-card';

        let lessonsHTML = '';
        userLessons.forEach((status, lessonIndex) => {
            let cls = 'btn-present';
            if (status === 'Н/Б') cls = 'btn-absent';
            if (status === 'П') cls = 'btn-reason';
            if (status === 'О') cls = 'btn-late';

            const disabledAttr = isParentView ? 'disabled style="cursor: default;"' : '';

            // Безопасный вызов функции по числовому индексу
            lessonsHTML += `
                <div class="lesson-box">
                    <span class="lesson-title">${lessonIndex + 1} ур</span>
                    <button class="btn-status ${cls}" ${disabledAttr} onclick="toggleStatus(${studentIndex}, ${lessonIndex})">${status}</button>
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

function toggleStatus(studentIndex, lessonIndex) {
    if (isParentView) return;

    const studentName = students[studentIndex];
    if (!studentName) return;

    const cycle = ['Б', 'Н/Б', 'П', 'О'];
    if (!currentDayData[studentName]) currentDayData[studentName] = Array(totalLessons).fill('Б');
    
    const current = currentDayData[studentName][lessonIndex] || 'Б';
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];

    currentDayData[studentName][lessonIndex] = next;

    saveToLocal();
    render();

    if (db) {
        db.ref(`attendance/${getKey()}/${studentName}`).set(currentDayData[studentName]).catch(() => {});
    }
}

function markAllPresent() {
    if (isParentView) return;
    students.forEach(name => {
        currentDayData[name] = Array(totalLessons).fill('Б');
    });
    saveToLocal();
    render();

    if (db) {
        db.ref(`attendance/${getKey()}`).set(currentDayData).catch(() => {});
    }
}

function setFilter(type, el) {
    currentFilter = type;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    render();
}

function copyWhatsAppReport() {
    let text = `📋 Отчет по посещаемости 8-З на ${getKey()}:\n\n`;
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

if (datePicker) {
    datePicker.addEventListener('change', () => {
        loadFromLocal();
        render();
        syncWithFirebase();
    });
}

loadFromLocal();
render();
syncWithFirebase();
