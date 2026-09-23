const students = [
    "Айбек уулу Нурбек",
    "Бакытова Айназик",
    "Исмаилов Данияр",
    "Касымова Мадина",
    "Султанов Азамат"
];

const totalLessons = 7;
const datePicker = document.getElementById('datePicker');
const studentsList = document.getElementById('studentsList');
const searchInput = document.getElementById('searchInput');

datePicker.valueAsDate = new Date();

function getStorageKey(dateStr = datePicker.value) {
    return `attendance_${dateStr}`;
}

function loadData(dateStr = datePicker.value) {
    const saved = localStorage.getItem(getStorageKey(dateStr));
    if (saved) return JSON.parse(saved);
    
    const initialData = {};
    students.forEach(name => {
        initialData[name] = Array(totalLessons).fill('Б');
    });
    return initialData;
}

function saveData(data) {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
}

function render() {
    const data = loadData();
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    studentsList.innerHTML = '';

    students.forEach(name => {
        if (query && !name.toLowerCase().includes(query)) return;

        const card = document.createElement('div');
        card.className = 'student-card';

        let absentCount = 0;
        let lessonsHTML = '';

        data[name].forEach((status, index) => {
            const isAbsent = status === 'Н/Б';
            if (isAbsent) absentCount++;
            
            const btnClass = isAbsent ? 'btn-absent' : 'btn-present';
            lessonsHTML += `
                <div class="lesson-box">
                    <span class="lesson-title">${index + 1} ур</span>
                    <button class="btn-status ${btnClass}" onclick="toggleStatus('${name}', ${index})">
                        ${status}
                    </button>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="student-info">
                <span class="student-name">${name}</span>
                <span class="absent-count">Пропусков: ${absentCount}</span>
            </div>
            <div class="lessons-grid">${lessonsHTML}</div>
        `;
        studentsList.appendChild(card);
    });
}

function toggleStatus(name, lessonIndex) {
    const data = loadData();
    data[name][lessonIndex] = data[name][lessonIndex] === 'Б' ? 'Н/Б' : 'Б';
    saveData(data);
    render();
}

function markAllPresent() {
    const data = {};
    students.forEach(name => {
        data[name] = Array(totalLessons).fill('Б');
    });
    saveData(data);
    render();
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

function copyWhatsAppReport() {
    const data = loadData();
    let report = `📋 *Посещаемость за ${datePicker.value}:*\n\n`;
    let hasAbsents = false;

    students.forEach(name => {
        const absents = [];
        data[name].forEach((status, idx) => {
            if (status === 'Н/Б') absents.push(idx + 1);
        });

        if (absents.length > 0) {
            hasAbsents = true;
            report += `❌ *${name}*: н/б на ${absents.join(', ')} ур.\n`;
        }
    });

    if (!hasAbsents) report += "✅ Все ученики присутствуют!";

    navigator.clipboard.writeText(report).then(() => {
        alert("Отчет скопирован в буфер обмена!");
    });
}

function openStats() {
    const modal = document.getElementById('statsModal');
    const body = document.getElementById('statsBody');
    body.innerHTML = '';

    const stats = {};
    students.forEach(name => stats[name] = 0);

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('attendance_')) {
            const dayData = JSON.parse(localStorage.getItem(key));
            students.forEach(name => {
                if (dayData[name]) {
                    dayData[name].forEach(status => {
                        if (status === 'Н/Б') stats[name]++;
                    });
                }
            });
        }
    }

    students.forEach(name => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `<span>${name}</span> <strong>${stats[name]} пропусков</strong>`;
        body.appendChild(item);
    });

    modal.classList.add('active');
}

function closeStats() {
    document.getElementById('statsModal').classList.remove('active');
}

datePicker.addEventListener('change', render);
render();
