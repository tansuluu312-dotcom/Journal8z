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
    console.warn("Офлайн режим.", e);
}

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

const today = new Date();
datePicker.value = today.toISOString().split('T')[0];


function getKey() {
    return datePicker.value;
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
            function toggleStatus(studentIndex, lessonIndex) {
    var name = students[studentIndex];
    if (!name) return;

    if (!currentData[name]) {
        currentData[name] = ['Б', 'Б', 'Б', 'Б', 'Б', 'Б', 'Б'];
    }
    
    var current = currentData[name][lessonIndex] || 'Б';
    if (current === 'Б') {
        currentData[name][lessonIndex] = 'Н/Б';
    } else if (current === 'Н/Б') {
        currentData[name][lessonIndex] = 'П';
    } else if (current === 'П') {
        currentData[name][lessonIndex] = 'О';
    } else {
        currentData[name][lessonIndex] = 'Б';
    }

    saveData();
}

        } else {
            db.ref(`attendance/${key}`).set(currentDayData);
        }
    }).catch(() => {});
}

function render() {
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

function toggleStatus(name, index) {
    const cycle = ['Б', 'Н/Б', 'П', 'О'];
    const current = currentDayData[name][index] || 'Б';
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];

    currentDayData[name][index] = next;

    saveToLocal();
    render();

    if (db) {
        db.ref(`attendance/${getKey()}/${name}`).set(currentDayData[name]).catch(() => {});
    }
}

function markAllPresent() {
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
    el.classList.add('active');
    render();
}

function copyWhatsAppReport() {
    let text = `📅 Отчет по посещаемости на ${datePicker.value}:\n\n`;
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
        alert("Отчет скопирован!");
    });
}

function openStats() {
    document.getElementById('statsModal').classList.add('active');
    const statsBody = document.getElementById('statsBody');
    statsBody.innerHTML = 'Загрузка...';

    const currentMonth = getKey().slice(0, 7);
    const stats = {};
    students.forEach(name => stats[name] = 0);

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`attendance_${currentMonth}`)) {
            try {
                const dayData = JSON.parse(localStorage.getItem(key));
                students.forEach(name => {
                    if (dayData[name]) {
                        stats[name] += dayData[name].filter(s => s !== 'Б').length;
                    }
                });
            } catch (e) {}
        }
    }

    const renderStatsUI = () => {
        let html = `<p style="font-weight: bold; margin-bottom: 8px;">Месяц: ${currentMonth}</p>`;
        students.forEach(name => {
            html += `<div class="stat-item"><span>${name}</span> <b>${stats[name]} проп.</b></div>`;
        });
        statsBody.innerHTML = html;
    };

    renderStatsUI();

    if (db) {
        db.ref('attendance').once('value').then(snapshot => {
            const allData = snapshot.val() || {};
            students.forEach(name => stats[name] = 0);

            Object.keys(allData).forEach(dateKey => {
                if (dateKey.startsWith(currentMonth)) {
                    const dayData = allData[dateKey];
                    students.forEach(name => {
                        if (dayData[name] && Array.isArray(dayData[name])) {
                            stats[name] += dayData[name].filter(s => s !== 'Б').length;
                        }
                    });
                }
            });
            renderStatsUI();
        }).catch(() => {});
    }
}

function closeStats() {
    document.getElementById('statsModal').classList.remove('active');
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

datePicker.addEventListener('change', () => {
    loadFromLocal();
    render();
    syncWithFirebase();
});

loadFromLocal();
render();
syncWithFirebase();
