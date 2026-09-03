// Full family / roster sign-up form — join.html
// Adapted from cte/8126/parent_form.html; posts the same payload shape to the
// same Apps Script backend (Parent Submissions sheet), plus an optional
// mailing-list opt-in that the backend also records in the Subscribers sheet.
(function () {
  let childCount = 0;
  let contactCount = 0;

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function makeContactBlock(index) {
    const ordinal = ['2nd', '3rd', '4th', '5th'][index] || (index + 2) + 'th';
    const block = el(`
      <div class="child-block contact-block">
        <button type="button" class="remove-child">Remove</button>
        <div class="child-title">${ordinal} contact</div>
        <div class="row2">
          <div><label>First name</label><input type="text" class="c-first"></div>
          <div><label>Last name</label><input type="text" class="c-last"></div>
        </div>
        <label>Email</label>
        <input type="email" class="c-email" placeholder="optional">
        <label>Phone</label>
        <input type="tel" class="c-phone" placeholder="(269) 555-1234  optional">
      </div>
    `);
    block.querySelector('.remove-child').addEventListener('click', () => block.remove());
    return block;
  }

  function makeChildBlock(index) {
    const rolesHtml = ROLE_OPTIONS.map(r =>
      `<label><input type="checkbox" name="role" value="${r}"> ${r}</label>`
    ).join('');
    const gradesHtml = GRADES.map(g => `<option value="${g}">${g}</option>`).join('');
    const sizesHtml = SHIRT_SIZES.map(s => `<option value="${s}">${s}</option>`).join('');
    const block = el(`
      <div class="child-block">
        ${index > 0 ? '<button type="button" class="remove-child">Remove</button>' : ''}
        <div class="child-title">Child ${index + 1}</div>
        <label>Child's name *</label>
        <input type="text" class="child-name" required>
        <div class="row2">
          <div>
            <label>Grade *</label>
            <select class="child-grade" required>
              <option value="">Select grade</option>
              ${gradesHtml}
            </select>
          </div>
          <div>
            <label>T-shirt size *</label>
            <select class="child-size" required>
              <option value="">Select size</option>
              ${sizesHtml}
            </select>
          </div>
        </div>
        <label>Interested role(s) — check all that apply</label>
        <div class="roles">${rolesHtml}</div>
      </div>
    `);
    const removeBtn = block.querySelector('.remove-child');
    if (removeBtn) removeBtn.addEventListener('click', () => block.remove());
    return block;
  }

  function renderForm() {
    const wrap = document.getElementById('familyFormWrap');
    wrap.innerHTML = `
      <p class="eyebrow">Ready to join the team?</p>
      <h1 style="margin-bottom:6px;">Family sign-up</h1>
      <p class="muted" style="margin-bottom:20px;">One form per family · takes about 2 minutes</p>
      <form id="parentForm">
        <div class="card">
          <h2>Parent / guardian</h2>
          <div class="row2">
            <div><label>First name *</label><input type="text" id="p-first" required></div>
            <div><label>Last name *</label><input type="text" id="p-last" required></div>
          </div>
          <label>Email *</label>
          <input type="email" id="p-email" required>
          <label>Phone *</label>
          <input type="tel" id="p-phone" required placeholder="(269) 555-1234">
          <div id="extraContactsContainer"></div>
          <button type="button" class="add-child-btn" id="addContactBtn" style="margin-top:14px;">+ Add another contact person</button>
        </div>
        <div class="card">
          <h2>Your child(ren)</h2>
          <div id="childrenContainer"></div>
          <button type="button" class="add-child-btn" id="addChildBtn">+ Add another child</button>
        </div>
        <div class="card">
          <label style="display:flex; align-items:center; gap:8px; margin:0; font-size:14px; color:var(--text); cursor:pointer;">
            <input type="checkbox" id="subscribeCheck" style="width:auto;" checked>
            Also subscribe this email to the club mailing list
          </label>
        </div>
        <div class="error-msg" id="formError"></div>
        <button type="submit" class="submit-btn" id="submitBtn">Submit →</button>
      </form>
    `;

    const extraContactsContainer = document.getElementById('extraContactsContainer');
    contactCount = 0;
    document.getElementById('addContactBtn').addEventListener('click', () => {
      extraContactsContainer.appendChild(makeContactBlock(contactCount++));
    });

    const container = document.getElementById('childrenContainer');
    childCount = 0;
    container.appendChild(makeChildBlock(childCount++));

    document.getElementById('addChildBtn').addEventListener('click', () => {
      container.appendChild(makeChildBlock(childCount++));
    });

    document.getElementById('parentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('formError');
      errorEl.style.display = 'none';

      const first = document.getElementById('p-first').value.trim();
      const last = document.getElementById('p-last').value.trim();
      const email = document.getElementById('p-email').value.trim();
      const phone = document.getElementById('p-phone').value.trim();
      const subscribeToMailingList = document.getElementById('subscribeCheck').checked;

      const additionalContacts = Array.from(
        extraContactsContainer.querySelectorAll('.contact-block')
      ).map(block => ({
        firstName: block.querySelector('.c-first').value.trim(),
        lastName: block.querySelector('.c-last').value.trim(),
        email: block.querySelector('.c-email').value.trim(),
        phone: block.querySelector('.c-phone').value.trim(),
      })).filter(c => c.firstName || c.lastName || c.email || c.phone);

      const childBlocks = Array.from(container.querySelectorAll('.child-block'));
      const children = [];
      let valid = first && last && email && phone && childBlocks.length > 0;

      for (const block of childBlocks) {
        const name = block.querySelector('.child-name').value.trim();
        const grade = block.querySelector('.child-grade').value;
        const size = block.querySelector('.child-size').value;
        const roles = Array.from(block.querySelectorAll('input[name="role"]:checked')).map(cb => cb.value);
        if (!name || !grade || !size) valid = false;
        children.push({ name, grade, shirtSize: size, roles });
      }

      if (!valid) {
        errorEl.textContent = 'Please fill in all required fields (marked with *).';
        errorEl.style.display = 'block';
        return;
      }

      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      try {
        const res = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({
            parent: { firstName: first, lastName: last, email, phone },
            additionalContacts,
            children,
            subscribeToMailingList,
            submittedAt: new Date().toISOString()
          })
        });
        const result = await res.json();
        if (result.status !== 'ok') throw new Error(result.message || 'Server error');
        showConfirmation();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit →';
        errorEl.textContent = 'Something went wrong. Please try again or email Mr. Bombich.';
        errorEl.style.display = 'block';
      }
    });
  }

  function showConfirmation() {
    document.getElementById('familyFormWrap').innerHTML = `
      <div class="confirm-screen">
        <span class="checkmark">✅</span>
        <h2>You're in!</h2>
        <p>Thanks — your family's info has been saved.<br>We'll be in touch about the season.</p>
        <button class="submit-btn" style="width:auto; padding:12px 24px;" onclick="location.reload()">Submit another family</button>
      </div>
    `;
  }

  renderForm();
})();
