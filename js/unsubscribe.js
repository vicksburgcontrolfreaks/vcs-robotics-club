// Unsubscribe confirmation page — unsubscribe.html?token=...
(async function () {
  const card = document.getElementById('unsubCard');
  const token = new URLSearchParams(location.search).get('token');

  function renderResult(ok, message) {
    card.innerHTML = `
      <div class="confirm-screen" style="padding:20px;">
        <span class="checkmark">${ok ? '✅' : '⚠️'}</span>
        <h2>${ok ? "You're unsubscribed" : "Couldn't process that"}</h2>
        <p>${message}</p>
        <a class="btn btn-navy" href="index.html">Back to home</a>
      </div>
    `;
  }

  if (!token) {
    renderResult(false, 'This link is missing an unsubscribe token. If you followed a link from an email, please try again or contact us.');
    return;
  }

  try {
    const url = SCRIPT_URL + '?action=unsubscribe&token=' + encodeURIComponent(token);
    const res = await fetch(url);
    const result = await res.json();
    if (result.status === 'ok') {
      renderResult(true, "You've been removed from the Vicksburg Robotics mailing list. Sorry to see you go!");
    } else {
      renderResult(false, result.message || 'That link is invalid or has already been used.');
    }
  } catch (err) {
    renderResult(false, 'Something went wrong reaching the server. Please try again in a moment.');
  }
})();
