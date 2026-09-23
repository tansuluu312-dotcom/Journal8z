// 1. Инициализация Firebase
var firebaseConfig = {
    apiKey: "AIzaSyCRSSm8to4ZY6Y9nyMEABD6lzcuDSbAPs",
    authDomain: "journal-8z.firebaseapp.com",
    databaseURL: "https://journal-8z-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "journal-8z",
    storageBucket: "journal-8z.appspot.com",
    messagingSenderId: "3821431182",
    appId: "1:3821431182:web:ea8a16b6533293b2f41cdf",
    measurementId: "G-6SKDG0ZEMN"
};

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
    }
} catch (e) {
    console.error("Ошибка подключения Firebase:", e);
}

var database = firebase.database();

// 2. Список учеников 8-З класса (35 человек)
var students = [
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

var totalLessons = 7;
var currentDayData = {};

var urlParams = new URLSearchParams(window.location.search);
var isReadOnly = urlParams.get('view') === 'readonly';

// 3. Установка даты по умолчанию
var datePicker = document.getElementById('datePicker');
if (datePicker) {
    var today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
    datePicker.addEventListener('change', loadData);
}

// 4. Загрузка данных из базы
function loadData() {
    if (!datePicker) return;
    var selectedDate = datePicker.value;
    
    database.ref('attendance/' + selectedDate).once('value').then(function(snapshot) {
        currentDayData = snapshot.val() || {};
        
        students.forEach(function(student) {
            if (!currentDayData[student]) {
                currentDayData[student] = Array(totalLessons).fill('Б');
            }
        });
        
        render();
    });
}

// 5. Цвета статусов
function getStatusBtnClass(status) {
    if (status === 'Н/Б') return 'btn-absent';
    if (status === 'П') return 'btn-reason';
    if (status === 'О') return 'btn-late';
    return 'btn-present';
}

// 6. Переключение статуса по клику
function toggleStatus(name, lessonIndex) {
    if (isReadOnly) return;
    
    if (!currentDayData[name]) {
        currentDayData[name] = Array(totalLessons).fill('Б');
    }
    
    var current = currentDayData[name][lessonIndex];
    
    if (current === 'Б') {
        currentDayData[name][lessonIndex] = 'Н/Б';
    } else if (current === 'Н/Б') {
        currentDayData[name][lessonIndex] = 'П';
    } else if (current === 'П') {
        currentDayData[name][lessonIndex] = 'О';
    } else {
        currentDayData[name][lessonIndex] = 'Б';
    }

    saveData();
}

// 7. Сохранение изменений в Firebase
function saveData() {
    if (!datePicker) return;
    var selectedDate = datePicker.value;
    database.ref('attendance/' + selectedDate).set(currentDayData).then(function() {
        render();
    });
}

// 8. Кнопка «Все есть»
function markAllPresent() {
    if (isReadOnly) return;
    students.forEach(function(student) {
        currentDayData[student] = Array(totalLessons).fill('Б');
    });
    saveData();
}

// 9. Отрисовка списка на экране
function render() {
    var list = document.getElementById('studentsList');
    if (!list) return;
    
    var searchInput = document.getElementById('searchInput');
    var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    list.innerHTML = '';

    students.forEach(function(student) {
        if (query && !student.toLowerCase().includes(query)) {
            return;
        }

        var attendance = currentDayData[student] || Array(totalLessons).fill('Б');
        
        while (attendance.length < totalLessons) {
            attendance.push('Б');
        }

        var absentCount = attendance.filter(function(s) { return s === 'Н/Б' || s === 'П' || s === 'О'; }).length;

        var card = document.createElement('div');
        card.className = 'student-card';

        var html = '<div class="student-info">' +
            '<span class="student-name">' + student + '</span>' +
            '<span class="absent-count">Отметок: ' + absentCount + '</span>' +
            '</div>' +
            '<div class="lessons-grid">';

        for (var i = 0; i < totalLessons; i++) {
            var status = attendance[i] || 'Б';
            var btnClass = getStatusBtnClass(status);
            var disabledAttr = isReadOnly ? 'disabled' : '';

            html += '<div class="lesson-box">' +
                '<span class="lesson-title">' + (i + 1) + ' ур</span>' +
                '<button class="btn-status ' + btnClass + '" ' + disabledAttr + ' onclick="toggleStatus(\'' + student.replace(/'/g, "\\'") + '\', ' + i + ')">' + status + '</button>' +
                '</div>';
        }

        html += '</div>';
        card.innerHTML = html;
        list.appendChild(card);
    });
}

var searchElement = document.getElementById('searchInput');
if (searchElement) {
    searchElement.addEventListener('input', render);
}

// 10. Переключение темы (день/ночь)
function toggleTheme() {
    var currentTheme = document.documentElement.getAttribute('data-theme');
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.innerText = newTheme === 'dark' ? '☀️' : '🌙';
}

// 11. Генерация отчета для WhatsApp
function copyWhatsAppReport() {
    if (!datePicker) return;
    var selectedDate = datePicker.value;
    var report = "📌 Отчёт по посещаемости за " + selectedDate + " (Класс 8-З):\n\n";
    var hasAbsents = false;

    students.forEach(function(student) {
        var attendance = currentDayData[student] || Array(totalLessons).fill('Б');
        var absents = [];

        for (var i = 0; i < totalLessons; i++) {
            if (attendance[i] === 'Н/Б') absents.push((i + 1) + " ур (Н/Б)");
            if (attendance[i] === 'П') absents.push((i + 1) + " ур (П)");
            if (attendance[i] === 'О') absents.push((i + 1) + " ур (Опоздал)");
        }

        if (absents.length > 0) {
            hasAbsents = true;
            report += "❌ " + student + ": " + absents.join(', ') + "\n";
        }
    });

    if (!hasAbsents) {
        report += "✅ Все ученики присутствовали!";
    }

    navigator.clipboard.writeText(report).then(function() {
        alert("Отчёт скопирован!");
    });
}

// Первичная загрузка данных при открытии
loadData();
