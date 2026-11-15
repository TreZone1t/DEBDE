document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('error', function(event) {
    var image = event.target;
    if (image.tagName === 'IMG' && image.dataset.fallbackApplied !== 'true') {
      image.dataset.fallbackApplied = 'true';
      image.src = image.dataset.fallback || '/assets/debde-icon.png';
    }
  }, true);

  var navToggle = document.querySelector('.nav-toggle');
  var navMenu = document.getElementById('primary-nav');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      var isOpen = navMenu.classList.toggle('is-open');
      var icon = navToggle.querySelector('i');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-xmark', isOpen);
      }
    });

    navMenu.addEventListener('click', function(event) {
      if (event.target.closest('a')) {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation');
        var icon = navToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      }
    });
  }

  var loginModal = document.getElementById('loginModal');
  var openLoginBtns = document.querySelectorAll('.js-open-login');
  var closeBtns = document.querySelectorAll('.js-close-modal');

  openLoginBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (loginModal) loginModal.classList.add('active');
    });
  });

  closeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (loginModal) loginModal.classList.remove('active');
    });
  });

  var homeLoginForm = document.getElementById('home-login-form');
  if (homeLoginForm) {
    homeLoginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      if (loginModal) loginModal.classList.remove('active');
    });
  }

  var freeCheckbox = document.getElementById('isFree');
  var priceInput = document.getElementById('itemPrice');
  if (freeCheckbox && priceInput) {
    freeCheckbox.addEventListener('change', function() {
      if (freeCheckbox.checked) {
        priceInput.value = '0';
        priceInput.disabled = true;
      } else {
        priceInput.value = '';
        priceInput.disabled = false;
      }
    });
  }
});
