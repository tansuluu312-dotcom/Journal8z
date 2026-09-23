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

if (datePicker) {
    datePicker.valueAsDate = new Date();
}

function getStorageKey() {
    return `attendance_${datePicker.value}`;
}

function loadData() {
    const saved = localStorage.getItem(getStorageKey());
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
    if (!studentsList) return;
    const data = loadData();
    studentsList.innerHTML = '';
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    students.forEach((name, studentIndex) => {
        if (searchQuery && !name.toLowerCase().includes(searchQuery)) {
            return;
        }

        const card = document.createElement('div');
        card.className = 'student-card';

        let absentCount = 0;
        let lessonsHTML = '';

        (data[name] || Array(totalLessons).fill('Б')).forEach((status, lessonIndex) => {
            const isAbsent = status === 'Н/Б';
            if (isAbsent) absentCount++;
            
            const btnClass = isAbsent ? 'btn-absent' : 'btn-present';
            lessonsHTML += `
                <div class="lesson-box">
                    <span class="lesson-title">${lessonIndex + 1} ур</span>
                    <button class="btn-status ${btnClass}" onclick="toggleStatus(${studentIndex}, ${lessonIndex})">
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

function toggleStatus(studentIndex, lessonIndex) {
    const name = students[studentIndex];
    const data = loadData();
    if (!data[name]) data[name] = Array(totalLessons).fill('Б');
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

function copyWhatsAppReport() {
    const data = loadData();
    const currentDate = datePicker ? datePicker.value.split('-').reverse().join('.') : '';
    
    let report = `📋 *Отсутствующие на ${currentDate} (8-З класс):*\n\n`;
    let hasAbsent = false;
    let count = 1;

    students.forEach(name => {
        const studentLessons = data[name] || Array(totalLessons).fill('Б');
        const absentLessons = [];

        studentLessons.forEach((status, index) => {
            if (status === 'Н/Б') {
                absentLessons.push(`${index + 1} ур`);
            }
        });

        if (absentLessons.length > 0) {
            hasAbsent = true;
            report += `${count}. *${name}* — ${absentLessons.join(', ')}\n`;
            count++;
        }
    });

    if (!hasAbsent) {
        report += "Все ученики присутствуют! 🎉";
    }

    navigator.clipboard.writeText(report).then(() => {
        alert("Отчет скопирован! Вставьте его в чат WhatsApp.");
    }).catch(() => {
        alert("Не удалось скопировать.");
    });
}

// РАБОТА СО СТАТИСТИКОЙ ЗА МЕСЯЦ
function openStats() {
    const modal = document.getElementById('statsModal');
    const statsBody = document.getElementById('statsBody');
    const selectedDate = datePicker ? datePicker.value : new Date().toISOString().split('T')[0];
    const targetYearMonth = selectedDate.substring(0, 7); // Формат YYYY-MM

    const studentTotals = {};
    students.forEach(name => studentTotals[name] = 0);

    let filledDaysCount = 0;
    let grandTotalAbsent = 0;

    // Сканируем localStorage за выбранный месяц
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`attendance_${targetYearMonth}`)) {
            filledDaysCount++;
            try {
                const dayData = JSON.parse(localStorage.getItem(key));
                students.forEach(name => {
                    if (dayData[name]) {
                        const count = dayData[name].filter(s => s === 'Н/Б').length;
                        studentTotals[name] += count;
                        grandTotalAbsent += count;
                    }
                });
            } catch (e) {}
        }
    }

    if (filledDaysCount === 0) {
        statsBody.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Нет зафиксированных данных за ${targetYearMonth}.</p>`;
        modal.classList.add('active');
        return;
    }

    // Сортировка по убыванию пропусков
    const sorted = Object.entries(studentTotals).sort((a, b) => b[1] - a[1]);
    const topAbsentees = sorted.filter(item => item[1] > 0);
    const perfectAttendance = sorted.filter(item => item[1] === 0);

    let html = `
        <div class="stat-item"><span>Отмечено дней:</span> <strong>${filledDaysCount}</strong></div>
        <div class="stat-item"><span>Всего пропущенных уроков:</span> <strong>${grandTotalAbsent}</strong></div>
        
        <div class="stat-title">🚨 Лидеры по пропускам:</div>
    `;

    if (topAbsentees.length > 0) {
        topAbsentees.slice(0, 5).forEach(([name, count], idx) => {
            html += `<div class="stat-item"><span>${idx + 1}. ${name}</span> <strong style="color: var(--absent-text);">${count} ур.</strong></div>`;
        });
    } else {
        html += `<p style="font-size: 0.85rem; color: var(--text-secondary);">Пропусков за месяц нет!</p>`;
    }

    html += `<div class="stat-title">🌟 100% посещаемость (${perfectAttendance.length} чел.):</div>`;
    if (perfectAttendance.length > 0) {
        html += `<p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">${perfectAttendance.map(item => item[0]).join(', ')}</p>`;
    } else {
        html += `<p style="font-size: 0.85rem; color: var(--text-secondary);">У всех есть хотя бы 1 пропуск.</p>`;
    }

    statsBody.innerHTML = html;
    modal.classList.add('active');
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

if (datePicker) {
    datePicker.addEventListener('change', render);
}

render();
