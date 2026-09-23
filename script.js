
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
    console.error("Ошибка подключения Firebase:", e);
}

const urlParams = new URLSearchParams(window.location.search);
const isParentView = urlParams.get('mode') === 'view';

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

let currentDayData = {};

if (datePicker && !datePicker.value) {
    datePicker.value = new Date().toISOString().split('T')[0];
}

function getKey() {
    return datePicker ? datePicker.value : new Date().toISOString().split('T')[0];
}

function loadDefaultData() {
    currentDayData = {};
    students.forEach(name => {
        currentDayData[name] = Array(totalLessons).fill('Б');
    });
}

// Подписка на изменения Firebase в реальном времени (.on('value'))
function listenToFirebase() {
    if (!db) return;
    const key = getKey();

    db.ref(`attendance/${key}`).on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
            currentDayData = val;
        } else {
            loadDefaultData();
        }
        render();
    });
}

function render() {
    if (!studentsList) return;
    studentsList.innerHTML = '';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (isParentView) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    students.forEach((name, studentIndex) => {
        if (query && !name.toLowerCase().includes(query)) return;

        const userLessons = currentDayData[name] || Array(totalLessons).fill('Б');
        const absentCount = userLessons.filter(s => s !== 'Б').length;

        const card = document.createElement('div');
        card.className = 'student-card';

        let lessonsHTML = '';
        userLessons.forEach((status, lessonIndex) => {
            let cls = 'btn-present';
            if (status === 'Н/Б') cls = 'btn-absent';
            if (status === 'П') cls = 'btn-reason';
            if (status === 'О') cls = 'btn-late';

            const disabledAttr = isParentView ? 'disabled style="opacity: 0.8; cursor: default;"' : '';

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

    // Сохраняем прямо в Firebase
    if (db) {
        db.ref(`attendance/${getKey()}/${studentName}`).set(currentDayData[studentName]);
    } else {
        render();
    }
}

function markAllPresent() {
    if (isParentView) return;
    loadDefaultData();
    if (db) {
        db.ref(`attendance/${getKey()}`).set(currentDayData);
    } else {
        render();
    }
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
        listenToFirebase();
    });
}

loadDefaultData();
listenToFirebase();
