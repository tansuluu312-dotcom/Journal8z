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

function getToday() {
    var d = new Date();
    return d.toISOString().split('T')[0];
}

function getKey() {
    var picker = document.getElementById('datePicker');
    return (picker && picker.value) ? picker.value : getToday();
}

function getData() {
    var raw = localStorage.getItem('journal_' + getKey());
    if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
    }
    var data = {};
    students.forEach(function(s) {
        data[s] = Array(totalLessons).fill('Б');
    });
    return data;
}

function saveData(data) {
    localStorage.setItem('journal_' + getKey(), JSON.stringify(data));
}

function render() {
    var list = document.getElementById('studentsList');
    if (!list) return;
    list.innerHTML = '';

    var data = getData();
    var searchInput = document.getElementById('searchInput');
    var query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    students.forEach(function(name) {
        if (query && !name.toLowerCase().includes(query)) return;

        var lessons = data[name] || Array(totalLessons).fill('Б');
        var count = lessons.filter(function(s) { return s !== 'Б'; }).length;

        var card = document.createElement('div');
        card.className = 'student-card';

        var html = '<div class="student-info"><span class="student-name">' + name + 
                   '</span><span class="absent-count">Отметок: ' + count + '</span></div><div class="lessons-grid">';

        for (var i = 0; i < totalLessons; i++) {
            var st = lessons[i] || 'Б';
            var cls = 'btn-present';
            if (st === 'Н/Б') cls = 'btn-absent';
            if (st === 'П') cls = 'btn-reason';
            if (st === 'О') cls = 'btn-late';

            html += '<div class="lesson-box"><span class="lesson-title">' + (i + 1) + 
                    ' ур</span><button class="btn-status ' + cls + '" onclick="toggleStatus(\'' + 
                    name.replace(/'/g, "\\'") + '\', ' + i + ')">' + st + '</button></div>';
        }

        html += '</div>';
        card.innerHTML = html;
        list.appendChild(card);
    });
}

function toggleStatus(name, index) {
    var data = getData();
    var lessons = data[name] || Array(totalLessons).fill('Б');
    var current = lessons[index];

    if (current === 'Б') lessons[index] = 'Н/Б';
    else if (current === 'Н/Б') lessons[index] = 'П';
    else if (current === 'П') lessons[index] = 'О';
    else lessons[index] = 'Б';

    data[name] = lessons;
    saveData(data);
    render();
}

function markAllPresent() {
    var data = {};
    students.forEach(function(s) {
        data[s] = Array(totalLessons).fill('Б');
    });
    saveData(data);
    render();
}

document.addEventListener('DOMContentLoaded', function() {
    var picker = document.getElementById('datePicker');
    if (picker) {
        picker.value = getToday();
        picker.addEventListener('change', render);
    }
    var search = document.getElementById('searchInput');
    if (search) {
        search.addEventListener('input', render);
    }
    render();
});
