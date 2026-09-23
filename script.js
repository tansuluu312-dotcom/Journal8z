// Список учеников 8-З класса (35 человек)
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

    students.forEach((name, studentIndex) => {
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

// Профессиональный экспорт через SheetJS (настоящий XLSX)
function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Библиотека Excel еще загружается, попробуйте через пару секунд.");
        return;
    }

    const data = loadData();
    const currentDate = datePicker ? datePicker.value : new Date().toISOString().split('T')[0];

    // Формируем массив данных
    const excelData = [
        ["ФИО Ученика", "1 урок", "2 урок", "3 урок", "4 урок", "5 урок", "6 урок", "7 урок", "Всего пропусков"]
    ];

    students.forEach(name => {
        const studentLessons = data[name] || Array(totalLessons).fill('Б');
        const absentCount = studentLessons.filter(s => s === 'Н/Б').length;
        
        excelData.push([
            name,
            ...studentLessons,
            absentCount
        ]);
    });

    // Создаем книгу и лист Excel
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Посещаемость");

    // Скачиваем бинарный файл .xlsx
    XLSX.writeFile(workbook, `Посещаемость_8З_${currentDate}.xlsx`);
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
