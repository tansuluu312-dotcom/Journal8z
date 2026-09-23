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
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (e) {
    console.error("Firebase error:", e);
}

var database = (typeof firebase !== 'undefined' && firebase.database) ? firebase.database() : null;

var students = [
    "Абдраманов Нурислам", "Акунжанова Арина", "Акунов Азирет Али", "Ахмедова Элиф",
    "Байдаалыев Али", "Востров Константин", "Джаныбеков Баяман", "Жумабекова Фатима",
    "Замирбекова Тансулуу", "Казыбеков Дамир", "Каныбекова Акинай", "Кирка Илья",
    "Колмурсаева Аруужан", "Конушбаева Мээрим", "Кочконбаев Байдөөлөт", "Кушалиев Азирет",
    "Кыдыралиев Тариэл", "Кылычбекова Мүрөк", "Майдинов Анвар", "Машаев Айдар",
    "Момуева Айдинай", "Мустафаев Амир", "Осмонова Афелия", "Осмонов Адахан",
    "Петров Руслан", "Рафатов Нурислам", "Рафатов Ясин", "Раханов Байхан",
    "Самыйбеков Байэл", "Сүйүндүкова Батыйна", "Тыныбеков Алиаскар", "Шааболотова Амина",
    "Шаршенбекова Сабина", "Эркинова Раяна", "Эрмеков Жусуп"
];

var totalLessons = 7;
var currentDayData = {};

function getTodayDate() {
    var d = new Date();
    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    var year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}

function getKey() {
    var datePicker = document.getElementById('datePicker');
    if (datePicker && datePicker.value) {
        return datePicker.value;
    }
    return getTodayDate();
}

function initEmptyData() {
    students.forEach(function(student) {
        if (!currentDayData[student]) {
            currentDayData[student] = Array(totalLessons).fill('Б');
        }
    });
}

function render() {
    var list = document.getElementById('studentsList');
    if (!list) return;
    
    var searchInput = document.getElementById('searchInput');
    var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    list.innerHTML = '';

    students.forEach(function(student) {
        if (query && !student.toLowerCase().includes(query)) return;

        var attendance = currentDayData[student] || Array(totalLessons).fill('Б');
        while (attendance.length < totalLessons) {
            attendance.push('Б');
        }

        var absentCount = attendance.filter(function(s) { return s !== 'Б'; }).length;

        var card = document.createElement('div');
        card.className = 'student-card';

        var html = '<div class="student-info">' +
            '<span class="student-name">' + student + '</span>' +
            '<span class="absent-count">Отметок: ' + absentCount + '</span>' +
            '</div>' +
            '<div class="lessons-grid">';

        for (var i = 0; i < totalLessons; i++) {
            var status = attendance[i] || 'Б';
            var btnClass = 'btn-present';
            if (status === 'Н/Б') btnClass = 'btn-absent';
            else if (status === 'П') btnClass = 'btn-reason';
            else if (status === 'О') btnClass = 'btn-late';

            html += '<div class="lesson-box">' +
                '<span class="lesson-title">' + (i + 1) + ' ур</span>' +
                '<button class="btn-status ' + btnClass + '" onclick="toggleStatus(\'' + student.replace(/'/g, "\\'") + '\', ' + i + ')">' + status + '</button>' +
                '</div>';
        }

        html += '</div>';
        card.innerHTML = html;
        list.appendChild(card);
    });
}

function syncWithFirebase() {
    if (!database) {
        initEmptyData();
        render();
        return;
    }
    
    var selectedDate = getKey();
    database.ref('attendance/' + selectedDate).on('value', function(snapshot) {
        var val = snapshot.val();
        if (val) {
            currentDayData = val;
        } else {
            currentDayData = {};
            initEmptyData();
        }
        render();
    });
}

function toggleStatus(name, lessonIndex) {
    if (!currentDayData[name]) {
        currentDayData[name] = Array(totalLessons).fill('Б');
    }
    
    var current = currentDayData[name][lessonIndex];
    if (current === 'Б') currentDayData[name][lessonIndex] = 'Н/Б';
    else if (current === 'Н/Б') currentDayData[name][lessonIndex] = 'П';
    else if (current === 'П') currentDayData[name][lessonIndex] = 'О';
    else currentDayData[name][lessonIndex] = 'Б';

    render();
    
    if (database) {
        database.ref('attendance/' + getKey()).set(currentDayData);
    }
}

function markAllPresent() {
    students.forEach(function(student) {
        currentDayData[student] = Array(totalLessons).fill('Б');
    });
    render();
    
    if (database) {
        database.ref('attendance/' + getKey()).set(currentDayData);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = getTodayDate();
        datePicker.addEventListener('change', function() {
            if (database) {
                database.ref('attendance/' + getKey()).off();
            }
            syncWithFirebase();
        });
    }

    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', render);
    }

    initEmptyData();
    render();
    syncWithFirebase();
});
