// Настройки Firebase базы данных
var firebaseConfig = {
    databaseURL: "https://journal-8z-default-rtdb.europe-west1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// Полный список класса 8-З
var students = [
    "Абдраманов Нурислам",
    "Акунжанова Арина",
    "Акунов Азирет Али",
    "Ахмедова Элиф",
    "Байдаалыев Али",
    "Востров Константин",
    "Дагилевич Самир",
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
var datePicker = document.getElementById('datePicker');
var studentsList = document.getElementById('studentsList');
var searchInput = document.getElementById('searchInput');

datePicker.valueAsDate = new Date();
var currentData = {};

function getDateKey() {
    return datePicker.value;
}

// Слушаем Firebase базу данных
function listenToDatabase() {
    var dateKey = getDateKey();
    database.ref('attendance/' + dateKey).on('value', function(snapshot) {
        var data = snapshot.val();
        if (data) {
            currentData = data;
        } else {
            currentData = {};
            for (var i = 0; i < students.length; i++) {
                currentData[students[i]] = ['Б', 'Б', 'Б', 'Б', 'Б', 'Б', 'Б'];
            }
        }
        render();
    });
}

function saveData() {
    var dateKey = getDateKey();
    database.ref('attendance/' + dateKey).set(currentData);
}

function render() {
    var query = searchInput ? searchInput.value.toLowerCase() : '';
    studentsList.innerHTML = '';

    for (var i = 0; i < students.length; i++) {
        var name = students[i];
        if (query && !name.toLowerCase().includes(query)) continue;

        var card = document.createElement('div');
        card.className = 'student-card';

        var absentCount = 0;
        var reasonCount = 0;
        var lessonsHTML = '';

        var studentStatusArray = currentData[name] || ['Б', 'Б', 'Б', 'Б', 'Б', 'Б', 'Б'];

        for (var j = 0; j < totalLessons; j++) {
            var status = studentStatusArray[j];
            var btnClass = 'btn-present';
            
            if (status === 'Н/Б') {
                btnClass = 'btn-absent';
                absentCount++;
            } else if (status === 'П') {
                btnClass = 'btn-reason';
                reasonCount++;
            }

            lessonsHTML += '<div class="lesson-box">' +
                '<span class="lesson-title">' + (j + 1) + ' ур</span>' +
                '<button class="btn-status ' + btnClass + '" onclick="toggleStatus(' + i + ', ' + j + ')">' +
                    status +
                '</button>' +
            '</div>';
        }

        var countText = 'Пропусков: ' + absentCount;
        if (reasonCount > 0) {
            countText += ' | П: ' + reasonCount;
        }

        card.innerHTML = '<div class="student-info">' +
            '<span class="student-name">' + name + '</span>' +
            '<span class="absent-count">' + countText + '</span>' +
        '</div>' +
        '<div class="lessons-grid">' + lessonsHTML + '</div>';

        studentsList.appendChild(card);
    }
}

function toggleStatus(studentIndex, lessonIndex) {
    var name = students[studentIndex];
    if (!currentData[name]) currentData[name] = ['Б', 'Б', 'Б', 'Б', 'Б', 'Б', 'Б'];
    
    var current = currentData[name][lessonIndex];
    if (current === 'Б') {
        currentData[name][lessonIndex] = 'Н/Б';
    } else if (current === 'Н/Б') {
        currentData[name][lessonIndex] = 'П';
    } else {
        currentData[name][lessonIndex] = 'Б';
    }

    saveData();
}

function markAllPresent() {
    for (var i = 0; i < students.length; i++) {
        currentData[students[i]] = ['Б', 'Б', 'Б', 'Б', 'Б', 'Б', 'Б'];
    }
    saveData();
}

function toggleTheme() {
    var body = document.body;
    var btn = document.getElementById('themeBtn');
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        btn.textContent = '🌙';
    } else {
        body.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
    }
}

function copyWhatsAppReport() {
    var report = '📋 *Посещаемость 8-З за ' + datePicker.value + ':*\n\n';
    var hasAbsents = false;

    for (var i = 0; i < students.length; i++) {
        var name = students[i];
        var studentData = currentData[name] || [];
        var absents = [];
        var reasons = [];

        for (var j = 0; j < studentData.length; j++) {
            if (studentData[j] === 'Н/Б') absents.push(j + 1);
            if (studentData[j] === 'П') reasons.push(j + 1);
        }

        if (absents.length > 0 || reasons.length > 0) {
            hasAbsents = true;
            report += '❌ *' + name + '*:';
            if (absents.length > 0) report += ' н/б (' + absents.join(', ') + ' ур)';
            if (reasons.length > 0) report += ' прич (' + reasons.join(', ') + ' ур)';
            report += '\n';
        }
    }

    if (!hasAbsents) report += '✅ Все ученики присутствуют!';

    navigator.clipboard.writeText(report).then(function() {
        alert('Отчет скопирован в буфер обмена!');
    });
}

function openStats() {
    var modal = document.getElementById('statsModal');
    var body = document.getElementById('statsBody');
    body.innerHTML = 'Загрузка...';
    modal.classList.add('active');

    database.ref('attendance').once('value', function(snapshot) {
        var allData = snapshot.val() || {};
        var stats = {};
        
        for (var k = 0; k < students.length; k++) {
            stats[students[k]] = 0;
        }

        for (var date in allData) {
            var dayObj = allData[date];
            for (var stName in dayObj) {
                if (stats[stName] !== undefined) {
                    var arr = dayObj[stName];
                    for (var m = 0; m < arr.length; m++) {
                        if (arr[m] === 'Н/Б') stats[stName]++;
                    }
                }
            }
        }

        body.innerHTML = '';
        for (var n = 0; n < students.length; n++) {
            var sName = students[n];
            var item = document.createElement('div');
            item.className = 'stat-item';
            item.innerHTML = '<span>' + sName + '</span> <strong>' + stats[sName] + ' пропусков</strong>';
            body.appendChild(item);
        }
    });
}

function closeStats() {
    document.getElementById('statsModal').classList.remove('active');
}

datePicker.addEventListener('change', function() {
    database.ref('attendance/' + getDateKey()).off();
    listenToDatabase();
});

listenToDatabase();
