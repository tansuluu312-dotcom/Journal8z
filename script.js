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

function exportToExcel() {
    const data = loadData();
    const currentDate = datePicker ? datePicker.value : new Date().toISOString().split('T')[0];
    
    let tableHTML = `<table border="1"><thead><tr>
        <th>ФИО Ученика</th>
        <th>1 урок</th><th>2 урок</th><th>3 урок</th><th>4 урок</th>
        <th>5 урок</th><th>6 урок</th><th>7 урок</th>
        <th>Всего пропусков</th>
    </tr></thead><tbody>`;

    students.forEach(name => {
        const studentLessons = data[name] || Array(totalLessons).fill('Б');
        const absentCount = studentLessons.filter(s => s === 'Н/Б').length;
        
        tableHTML += `<tr><td>${name}</td>`;
        studentLessons.forEach(st => {
            tableHTML += `<td>${st}</td>`;
        });
        tableHTML += `<td>${absentCount}</td></tr>`;
    });

    tableHTML += `</tbody></table>`;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Посещаемость_8З_${currentDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

if (datePicker) {
    datePicker.addEventListener('change', render);
}

render();
