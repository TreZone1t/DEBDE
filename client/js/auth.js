document.addEventListener('DOMContentLoaded', function () {
  var loginSec = document.getElementById('login-section');
  var registerSec = document.getElementById('register-section');
  var loginBtn = document.getElementById('tab-login-btn');
  var registerBtn = document.getElementById('tab-register-btn');
  var alertBox = document.getElementById('auth-alert');

  function showTab(tab) {
    var loginActive = tab === 'login';
    loginSec.classList.toggle('is-hidden', !loginActive);
    registerSec.classList.toggle('is-hidden', loginActive);
    loginBtn.classList.toggle('is-active', loginActive);
    registerBtn.classList.toggle('is-active', !loginActive);
    alertBox.innerHTML = '';
  }

  loginBtn.addEventListener('click', function () { showTab('login'); });
  registerBtn.addEventListener('click', function () { showTab('register'); });

  document.getElementById('accountRole').addEventListener('change', function () {
    var isStudent = this.value === 'student';
    var nameLabel = document.getElementById('nameLabel');
    var nameInput = document.getElementById('nameInput');
    var facultyGroup = document.getElementById('facultyGroup');
    nameLabel.textContent = isStudent ? 'Full Name' : (this.value === 'club' ? 'Club / Organization Name' : 'Store / Supplier Name');
    nameInput.placeholder = isStudent ? 'e.g. Omar Tarek' : (this.value === 'club' ? 'e.g. IEEE CS Student Chapter' : 'e.g. Campus Engineering Bookshop');
    facultyGroup.classList.toggle('is-hidden', !isStudent);
  });

  document.getElementById('facultySelect').addEventListener('change', function () {
    var customInput = document.getElementById('customFacultyInput');
    var isCustom = this.value === 'OTHER';
    customInput.classList.toggle('is-hidden', !isCustom);
    customInput.required = isCustom;
  });
});
