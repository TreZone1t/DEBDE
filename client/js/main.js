document.addEventListener('DOMContentLoaded', function() {
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
