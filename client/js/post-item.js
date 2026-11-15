document.addEventListener('DOMContentLoaded', function () {
  var fileInput = document.getElementById('itemImage');
  var dataInput = document.getElementById('imageData');

  if (!fileInput || !dataInput) return;

  fileInput.addEventListener('change', function () {
    var file = fileInput.files[0];
    if (!file) {
      dataInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      fileInput.value = '';
      dataInput.value = '';
      window.alert('Please choose an image smaller than 5 MB.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function () { dataInput.value = reader.result; };
    reader.readAsDataURL(file);
  });
});
