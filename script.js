// Конфигурация Firebase
const firebaseConfig = {
    databaseURL: "https://journal8z-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Список учеников 8-З
const students = [
    "Абдраманов Нурислам",
    "Акунжанова Арина",
    "Акунов Азирет Али",
    "Ахмедова Элиф",
    "Байдаалыев Али",
    "Востров Константин",
    "Джаныбеков Балман",
    "Жумабекова Фатима",
    "Замирбекова Тансулуу",
    "Казыбеков Данир",
    "Каныбекова Акинай",
    "Кирка Илья",
    "Колмурсаева Аруужан",
    "Конушбаева Нээрин",
    "Кочконбаев Байдөөлөт",
    "Кубалиев Азирет",
    "Кыдыралиев Тариэл",
    "Кылычбекова Нүрек",
    "Майдинов Анвар",
    "Мамаев Айдар",
    "Монуева Айдинай",
    "Мустафаев Амир",
    "Осмонова Афелия",
    "Осмонов Адахан",
    "Петров Руслан",
    "Рафатов Нурислам",
    "Рафатов Ясин",
    "Раханов Байхан",
    "Самыйбеков Байэл"
];

const totalLessons = 7;
const datePicker = document.getElementById('datePicker');
const studentsList = document.getElementById('studentsList');
const searchInput = document.getElementById('searchInput');

let currentFilter = 'all';

// Проверка режима только для чтения (для родителей)
const urlParams = new URLSearchParams(window.location.search);
const isParentView = urlParams.get('mode') === 'view';

// Установка сегодняшней даты
const today = new Date();
datePicker.value = today.toISOString().split('T')[0];

if (isParentView) {
    const btnAll = document.getElementById('btnAllPresent');
    if (btnAll) btnAll.style.display = 'none';
}

function getFormattedDateKey() {
    return datePicker.value;
}

function loadData(callback) {
    const key = getFormattedDateKey();
    db.ref('attendance/' + key).once('value').then(snapshot => {
        let data = snapshot.val();
        if (!data) {
            data = {};
            students.forEach(name => {
                data[name] = Array(totalLessons).fill('Б');
            });
        }
        callback(data);
    });
}

function saveData(data) {
    if (isParentView) return;
    const key = getFormattedDateKey();
    db.ref('attendance/' + key).set(data);
    localStorage.setItem(`attendance_${key}`, JSON.stringify(data));
}

function setFilter(filter, element) {
    currentFilter = filter;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    render();
}

function render() {
    loadData(data => {
        studentsList.innerHTML = '';
        const searchQuery = searchInput.value.toLowerCase();

        students.forEach(name => {
            if (!name.toLowerCase().includes(searchQuery)) return;

            const userLessons = data[name] || Array(totalLessons).fill('Б');
            const absentCount = userLessons.filter(s => s === 'Н/Б' || s === 'П' || s === 'О').length;

            if (currentFilter === 'absent' && !userLessons.includes('Н/Б')) return;
            if (currentFilter === 'reason' && !userLessons.includes('П')) return;
            if (currentFilter === 'late' && !userLessons.includes('О')) return;

            const card = document.createElement('div');
            card.className = 'student-card';

            let lessonsHTML = '';
            userLessons.forEach((status, index) => {
                let btnClass = 'btn-present';
                if (status === 'Н/Б') btnClass = 'btn-absent';
                if (status === 'П') btnClass = 'btn-reason';
                if (status === 'О') btnClass = 'btn-late';

                const disabledAttr = isParentView ? 'disabled' : '';

                lessonsHTML += `
                    <div class="lesson-box">
                        <span class="lesson-title">${index + 1} ур</span>
                        <button class="btn-status ${btnClass}" ${disabledAttr} onclick="toggleStatus('${name}', ${index})">
                            ${status}
                        </button>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="student-info">
                    <span class="student-name">${name}</span>
                    <span class="absent-count">Н/Б: ${absentCount}</span>
                </div>
                <div class="lessons-grid">${lessonsHTML}</div>
            `;
            studentsList.appendChild(card);
        });
    });
}

// Циклическое переключение статусов: Б -> Н/Б -> П -> О -> Б
function toggleStatus(name, lessonIndex) {
    if (isParentView) return;
    loadData(data => {
        const statuses = ['Б', 'Н/Б', 'П', 'О'];
        const current = data[name][lessonIndex] || 'Б';
        const nextIndex = (statuses.indexOf(current) + 1) % statuses.length;
        data[name][lessonIndex] = statuses[nextIndex];
        saveData(data);
        render();
    });
}

function markAllPresent() {
    if (isParentView) return;
    const data = {};
    students.forEach(name => {
        data[name] = Array(totalLessons).fill('Б');
    });
    saveData(data);
    render();
}

function copyWhatsAppReport() {
    loadData(data => {
        let text = `📅 Отчет по посещаемости на ${datePicker.value}:\n\n`;
        let hasAbsent = false;

        students.forEach(name => {
            const userLessons = data[name] || [];
            const absents = userLessons.map((s, i) => (s !== 'Б' ? `${i + 1} ур (${s})` : null)).filter(Boolean);
            if (absents.length > 0) {
                text += `• ${name}: ${absents.join(', ')}\n`;
                hasAbsent = true;
            }
        });

        if (!hasAbsent) text += "Все присутствуют! 🎉";

        navigator.clipboard.writeText(text).then(() => {
            alert("Отчет скопирован! Вставьте его в чат WhatsApp.");
        });
    });
}

function openStats() {
    document.getElementById('statsModal').classList.add('active');
    const statsBody = document.getElementById('statsBody');
    statsBody.innerHTML = 'Загрузка...';

    const currentMonth = datePicker.value.slice(0, 7);

    db.ref('attendance').once('value').then(snapshot => {
        const allData = snapshot.val() || {};
        const stats = {};

        students.forEach(name => stats[name] = 0);

        Object.keys(allData).forEach(date => {
            if (date.startsWith(currentMonth)) {
                const dayData = allData[date];
                students.forEach(name => {
                    if (dayData[name]) {
                        const count = dayData[name].filter(s => s === 'Н/Б' || s === 'П' || s === 'О').length;
                        stats[name] += count;
                    }
                });
            }
        });

        let html = `<h4>Месяц: ${currentMonth}</h4><br>`;
        Object.keys(stats).forEach(name => {
            html += `<div class="stat-item"><span>${name}</span> <b>${stats[name]} ур.</b></div>`;
        });
        statsBody.innerHTML = html;
    });
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

datePicker.addEventListener('change', render);
db.ref('attendance/' + getFormattedDateKey()).on('value', () => render());

render();
