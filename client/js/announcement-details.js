function escapeAnnouncement(value) {
  return String(value || '').replace(/[&<>"']/g, function (character) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
  });
}

async function loadAnnouncement() {
  var box = document.getElementById('announcement-details');
  var id = new URLSearchParams(location.search).get('id');
  if (!id) { box.textContent = 'No announcement selected.'; return; }
  try {
    var response = await fetch('/api/announcements/' + encodeURIComponent(id));
    if (!response.ok) throw new Error();
    var item = await response.json();
    box.innerHTML = '<a href="../index.html">← Back to home</a>'
      + '<img class="announcement-detail-image" src="' + escapeAnnouncement(item.image || '/assets/debde-icon.png') + '" alt="">'
      + '<span class="announcement-type">' + escapeAnnouncement(item.type) + '</span>'
      + '<h1>' + escapeAnnouncement(item.title) + '</h1>'
      + '<p class="announcement-detail-author">Posted by ' + escapeAnnouncement(item.author) + '</p>'
      + '<p>' + escapeAnnouncement(item.description || 'Campus information shared with the selected community.') + '</p>'
      + '<p class="item-meta">' + escapeAnnouncement(item.university) + ' · ' + escapeAnnouncement(item.city) + ' · ' + escapeAnnouncement(item.campus) + '</p>'
      + '<a class="btn btn-primary" href="../index.html">Back to campus board</a>';
  } catch (error) {
    box.textContent = 'Could not load this announcement.';
  }
}

loadAnnouncement();
