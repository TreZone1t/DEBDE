const MEETUP_SPOTS = ['Gate 2 Security', 'Library Reception', 'Student Activity Hub'];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, function (character) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
  });
}

async function loadItem() {
  const id = new URLSearchParams(location.search).get('id');
  const box = document.getElementById('details');
  if (!id) { box.textContent = 'No item selected.'; return; }
  try {
    const response = await fetch('/api/catalog/' + encodeURIComponent(id));
    if (!response.ok) throw new Error();
    renderItem(await response.json());
  } catch { box.textContent = 'Could not load this item.'; }
}

function renderItem(item) {
  const available = item.status === 'available';
  const price = Number(item.price) === 0 ? 'Free (Donation)' : item.price + ' EGP';
  const history = item.usageHistory && item.usageHistory.length
    ? item.usageHistory.map(function (entry) { return '<li>' + esc(entry) + '</li>'; }).join('')
    : '<li>No usage history yet.</li>';

  document.getElementById('details').innerHTML = `
    <a href="catalog.html">← Back to catalog</a>
    <img class="details-image" src="${esc(item.image || '/assets/debde-icon.png')}" alt="${esc(item.title)}">
    <h2>${esc(item.title)}</h2>
    <span class="badge ${available ? 'badge-available' : 'badge-sold'}">${available ? 'Available' : 'Sold'}</span>
    <p><strong>${price}</strong></p>
    <p><strong>Course:</strong> ${esc(item.course)}<br>
       <strong>Term / Semester used:</strong> ${esc(item.term)}<br>
       <strong>Faculty:</strong> ${esc(item.faculty)}<br>
       <strong>Condition:</strong> ${esc(item.condition)}${item.conditionNotes ? ' - ' + esc(item.conditionNotes) : ''}<br>
       <strong>Pickup spot:</strong> ${esc(item.pickupSpot)}</p>
    <p>Owner: ${esc(item.ownerName || 'Student')}
      ${item.ownerVerified ? '<span class="badge badge-verified">Verified Student</span>' : ''}</p>
    <div class="section"><h3>Usage History</h3><ul>${history}</ul></div>
    <div class="section">
      <h3>Contact &amp; Meetup</h3>
      <label>Preferred meetup spot:
        <select id="spot">${MEETUP_SPOTS.map(function (spot) { return '<option>' + spot + '</option>'; }).join('')}</select>
      </label>
      <p class="details-actions">
        <a id="wa-link" class="btn btn-primary ${available ? '' : 'btn-disabled'}" target="_blank" rel="noopener">Contact on WhatsApp</a>
        <button id="wish-btn" class="btn btn-sm" type="button">Add to Saved Wishlist</button>
      </p>
      <p id="wish-msg" class="wish-message"></p>
    </div>`;

  const updateLink = function () {
    const spot = document.getElementById('spot').value;
    const message = `Hi, I am interested in your listing on DeBDe: "${item.title}". Can we meet at ${spot}?`;
    document.getElementById('wa-link').href = 'https://wa.me/' + encodeURIComponent(item.ownerPhone || '201XXXXXXXXX') + '?text=' + encodeURIComponent(message);
  };
  document.getElementById('spot').addEventListener('change', updateLink);
  updateLink();

  document.getElementById('wish-btn').addEventListener('click', async function () {
    const output = document.getElementById('wish-msg');
    try {
      const response = await fetch('/api/catalog/wishlist/' + encodeURIComponent(item.id), { method: 'POST' });
      output.textContent = response.ok ? 'Saved to your wishlist.' : 'Could not save (are you logged in?).';
    } catch { output.textContent = 'Wishlist is unavailable right now.'; }
  });
}

loadItem();
