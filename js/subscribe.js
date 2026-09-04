// Quick "join the mailing list" form — join.html
(function () {
  function renderSubscribeForm() {
    const card = document.getElementById('subscribeCard');
    card.innerHTML = `
      <h2>Mailing list sign-up</h2>
      <label>Your name</label>
      <input type="text" id="sub-name" placeholder="Optional">
      <label>Email *</label>
      <input type="email" id="sub-email" required placeholder="you@example.com">
      <label>Which updates would you like? *</label>
      <div class="roles" id="subLists">${listOptionsHtml('sub-list')}</div>
      <div class="error-msg" id="subError"></div>
      <button type="button" class="submit-btn" id="subSubmitBtn">Subscribe →</button>
    `;

    document.getElementById('subSubmitBtn').addEventListener('click', async () => {
      const errorEl = document.getElementById('subError');
      errorEl.style.display = 'none';

      const name = document.getElementById('sub-name').value.trim();
      const email = document.getElementById('sub-email').value.trim();
      const lists = Array.from(
        document.querySelectorAll('input[name="sub-list"]:checked')
      ).map(cb => cb.value);

      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        errorEl.textContent = 'Please enter a valid email address.';
        errorEl.style.display = 'block';
        return;
      }

      if (lists.length === 0) {
        errorEl.textContent = 'Please choose at least one list.';
        errorEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('subSubmitBtn');
      btn.disabled = true;
      btn.textContent = 'Subscribing…';

      try {
        const res = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'subscribe', name, email, lists, source: 'quick-subscribe' })
        });
        const result = await res.json();
        if (result.status !== 'ok') throw new Error(result.message || 'Server error');
        showSubscribeConfirmation();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Subscribe →';
        errorEl.textContent = 'Something went wrong. Please try again in a moment.';
        errorEl.style.display = 'block';
      }
    });
  }

  function showSubscribeConfirmation() {
    document.getElementById('subscribeCard').innerHTML = `
      <div class="confirm-screen" style="padding:20px;">
        <span class="checkmark">✅</span>
        <h2>You're on the list!</h2>
        <p>Check your inbox for a confirmation email — it includes an unsubscribe link if you ever need it.</p>
      </div>
    `;
  }

  renderSubscribeForm();
})();
