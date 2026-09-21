/* The Trade Loft — menu, enquiry form, parallax. No dependencies. */
(function () {
  'use strict';

  // To send enquiries without relying on the visitor's email app, paste a form
  // endpoint here (for example https://formspree.io/f/xxxxxxxx). Leave empty
  // and the form opens the visitor's email app with everything filled in.
  var ENDPOINT = '';
  var TO = 'info@thetradeloft.co.uk';
  var PHONE = '07566 225606';

  var KINDS = {
    partnership: { title: 'Enquire about a partnership', intro: 'Tell us what you’re holding and how often. We reply within two working days.', org: 'Company or charity', ph: 'What stock, roughly how much, how often, and where.', subject: 'Partnership enquiry' },
    charity: { title: 'Set up a charity collection', intro: 'Tell us about your shops and how quickly bags build up. We reply within two working days with a per-bag rate and a collection day.', org: 'Charity', ph: 'How many shops, where they are, roughly how many bags a week, and any days that suit.', subject: 'Charity collection enquiry' },
    lot: { title: 'Send us a lot', intro: 'Describe the stock and we’ll come back with a price for the lot within two working days.', org: 'Company', ph: 'What the stock is, roughly how many pallets or cages, where it is, and when it needs to move. Photos help — we’ll reply asking for them.', subject: 'Stock lot enquiry' },
    donation: { title: 'Arrange a collection', intro: 'For a car-load or more we can collect. Give us a postcode and a rough idea of quantity.', org: 'Postcode', ph: 'Roughly how many bags or boxes, and any days or times that suit you.', subject: 'Donation collection request' }
  };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---- mobile menu ---- */
  var menu = $('#mobile-menu'), toggle = $('#menu-toggle');
  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  $$('[data-close-menu]').forEach(function (el) {
    el.addEventListener('click', function () { setMenu(false); });
  });

  /* ---- enquiry dialog ---- */
  var modal = $('#enquire'), form = $('#enquiry-form'), status = $('#enquiry-status'), send = $('#enquiry-send');
  var kind = 'partnership', lastFocus = null;

  function idleText() { return ENDPOINT ? '' : 'Opens in your email app, addressed to ' + TO; }

  function openEnquiry(k) {
    kind = KINDS[k] ? k : 'partnership';
    var K = KINDS[kind];
    $('#enquiry-title').textContent = K.title;
    $('#enquiry-intro').textContent = K.intro;
    $('#enquiry-org').textContent = K.org;
    form.elements.message.placeholder = K.ph;
    status.textContent = idleText();
    send.textContent = 'Send Enquiry';
    send.disabled = false;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    form.elements.name.focus();
  }
  function closeEnquiry() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-enquire]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      setMenu(false);
      openEnquiry(a.getAttribute('data-enquire'));
    });
  });
  $$('[data-close-enquiry]').forEach(function (el) {
    el.addEventListener('click', function () { closeEnquiry(); });
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeEnquiry(); });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeEnquiry(); setMenu(false); }
  });
  form.addEventListener('input', function () {
    if (send.textContent === 'Send Enquiry' && status.textContent !== idleText()) status.textContent = idleText();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var K = KINDS[kind];
    var el = form.elements;
    var f = {
      name: el.name.value.trim(), company: el.company.value.trim(), phone: el.phone.value.trim(),
      email: el.email.value.trim(), message: el.message.value.trim()
    };
    if (!f.name || !f.company || !f.phone || !f.email || !f.message) {
      status.textContent = 'Please fill in every field.';
      return;
    }
    if (!el.email.checkValidity()) {
      status.textContent = 'Please check the email address.';
      el.email.focus();
      return;
    }
    var subject = K.subject + ' — ' + f.company;
    var body = 'Name: ' + f.name + '\n' + K.org + ': ' + f.company + '\nPhone: ' + f.phone + '\nEmail: ' + f.email + '\n\n' + f.message;

    if (!ENDPOINT) {
      window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Your email app should now have the enquiry ready to send. If nothing opened, email ' + TO + ' or call ' + PHONE + '.';
      send.textContent = 'Opened in email';
      return;
    }

    send.disabled = true;
    send.textContent = 'Sending…';
    status.textContent = '';
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name: f.name, company: f.company, phone: f.phone, email: f.email, message: f.message, kind: kind, _subject: subject, _replyto: f.email })
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      send.textContent = 'Sent ✓';
      status.textContent = 'Sent — we’ll be in touch within two working days.';
      form.reset();
    }).catch(function () {
      send.disabled = false;
      send.textContent = 'Send Enquiry';
      status.textContent = 'Could not send — email us directly at ' + TO;
    });
  });

  /* ---- parallax on photos ---- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    var imgs = $$('img[data-parallax]'), raf = 0;
    var update = function () {
      raf = 0;
      var vh = window.innerHeight;
      imgs.forEach(function (img) {
        var box = img.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) return;
        var p = (box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2);
        img.style.transform = 'translate3d(0,' + (-p * box.height * 0.05).toFixed(1) + 'px,0)';
      });
    };
    var onScroll = function () { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---- image protection (kept from the original export) ---- */
  document.addEventListener('contextmenu', function (e) { if (!e.target.closest('input,textarea')) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); });
})();
