document.addEventListener('DOMContentLoaded', function () {
  var modal = document.getElementById('meetupModal');
  document.querySelectorAll('.js-open-meetup').forEach(function (button) {
    button.addEventListener('click', function () { modal.classList.add('active'); });
  });
  document.querySelectorAll('.js-close-meetup').forEach(function (button) {
    button.addEventListener('click', function () { modal.classList.remove('active'); });
  });
  modal.addEventListener('click', function (event) {
    if (event.target === modal) modal.classList.remove('active');
  });

  var params = new URLSearchParams(location.search);
  var faculty = params.getAll('faculty');
  var q = params.get('q') || '';
  if (!faculty.length && !q) return;
  document.getElementById('q-field').value = q;

  var map = {
    'engineering': ['Engineering'],
    'computer science & it': ['CS & IT'],
    'cs & it': ['CS & IT'],
    'medicine & pharmacy': ['Medicine', 'Pharmacy'],
    'medicine': ['Medicine'],
    'pharmacy': ['Pharmacy'],
    'science': ['Science']
  };
  faculty.forEach(function (name) {
    (map[name.toLowerCase()] || []).forEach(function (value) {
      var checkbox = document.querySelector('input[name="faculty"][value="' + value + '"]');
      if (checkbox) checkbox.checked = true;
    });
  });
  htmx.ajax('GET', '/api/catalog?all=1&' + params.toString(), '#catalog-grid');
});
