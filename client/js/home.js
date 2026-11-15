document.addEventListener('DOMContentLoaded', async function () {
  var universitySelect = document.getElementById('university-select');
  var citySelect = document.getElementById('city-select');
  var campusSelect = document.getElementById('campus-select');
  var ticker = document.getElementById('announcement-slot');
  var cards = document.getElementById('announcement-cards');
  var context = document.getElementById('campus-context');
  var directory = [];

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }

  function fillSelect(select, values, placeholder) {
    select.innerHTML = '<option value="">' + placeholder + '</option>' + values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    }).join('');
    select.disabled = values.length === 0;
  }

  function selectedLocation() {
    return {
      university: universitySelect.value,
      city: citySelect.value,
      campus: campusSelect.value
    };
  }

  async function refreshAnnouncements() {
    var location = selectedLocation();
    var query = new URLSearchParams(location).toString();
    var response = await fetch('/api/announcements/list?' + query);
    var items = await response.json();
    var tickerResponse = await fetch('/api/announcements?' + query);
    ticker.innerHTML = await tickerResponse.text();
    context.textContent = [location.university, location.city, location.campus].filter(Boolean).join(' · ') || 'All campus communities';
    cards.innerHTML = items.map(function (item) {
      return '<article class="announcement-card">'
        + '<img src="' + escapeHtml(item.image) + '" alt="">'
        + '<div class="announcement-card-body">'
        + '<span class="announcement-type">' + escapeHtml(item.type) + '</span>'
        + '<h3>' + escapeHtml(item.title) + '</h3>'
        + '<p class="announcement-description">' + escapeHtml(item.description || 'A campus update for the selected community.') + '</p>'
        + '<p>' + escapeHtml(item.city) + ' · ' + escapeHtml(item.campus) + '</p>'
        + '<a class="text-link" href="' + escapeHtml(item.link) + '">View details <span aria-hidden="true">→</span></a>'
        + '</div></article>';
    }).join('');
  }

  function availableCities() {
    var university = directory.find(function (entry) { return entry.university === universitySelect.value; });
    var cities = university ? university.cities : directory.reduce(function (all, entry) { return all.concat(entry.cities); }, []);
    return cities.filter(function (city, index, all) {
      return all.findIndex(function (item) { return item.city === city.city; }) === index;
    });
  }

  function availableCampuses() {
    var university = directory.find(function (entry) { return entry.university === universitySelect.value; });
    var cities = university ? university.cities : availableCities();
    var city = cities.find(function (entry) { return entry.city === citySelect.value; });
    var campuses = city ? city.campuses : cities.reduce(function (all, entry) { return all.concat(entry.campuses); }, []);
    return campuses.filter(function (campus, index, all) { return all.indexOf(campus) === index; });
  }

  function updateCities() {
    fillSelect(citySelect, availableCities().map(function (entry) { return entry.city; }), 'All');
    fillSelect(campusSelect, availableCampuses(), 'All');
    refreshAnnouncements();
  }

  function updateCampuses() {
    fillSelect(campusSelect, availableCampuses(), 'All');
    refreshAnnouncements();
  }

  universitySelect.addEventListener('change', updateCities);
  citySelect.addEventListener('change', updateCampuses);
  campusSelect.addEventListener('change', refreshAnnouncements);

  directory = await (await fetch('/api/campus/options')).json();
  fillSelect(universitySelect, directory.map(function (entry) { return entry.university; }), 'All');
  fillSelect(citySelect, availableCities().map(function (entry) { return entry.city; }), 'All');
  fillSelect(campusSelect, availableCampuses(), 'All');
  await refreshAnnouncements();
});
