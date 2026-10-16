(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('header');
  const progress = document.querySelector('.progress');
  const bar = document.querySelector('.mobile-bar');
  const hero = document.querySelector('.hero');
  const register = document.querySelector('#register');
  const highlights = [...document.querySelectorAll('h1 em, h2 em')];
  const graphics = [...document.querySelectorAll('.laptop, .step-visual, .about-symbol')];
  const clamp = value => Math.min(1, Math.max(0, value));
  let scheduled = false;
  document.documentElement.classList.add('motion-enabled');
  function update() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const heroBottom = hero.getBoundingClientRect().bottom;
    const registerTop = register.getBoundingClientRect().top;
    // Read geometry before writing styles to keep scrolling smooth.
    const fills = highlights.map(el => {
      const rect = el.getBoundingClientRect();
      if (preference.matches) return 1;
      if (el.closest('h1')) return clamp(y / (vh * .3));
      return clamp((vh * .96 - rect.top) / (vh * .49));
    });
    const positions = graphics.map(el => {
      const rect = el.parentElement.getBoundingClientRect();
      return clamp((vh - rect.top) / (vh + rect.height));
    });
    header.classList.toggle('scrolled', y > 15);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    bar.classList.toggle('visible', heroBottom < 0 && registerTop > vh);
    highlights.forEach((el, i) => el.style.setProperty('--highlight', `${fills[i] * 100}%`));
    graphics.forEach((el, i) => {
      if (preference.matches) { el.style.transform = ''; return; }
      const amount = positions[i];
      const travel = window.innerWidth < 800 ? 12 : 24;
      const offset = (amount - .5) * -travel;
      const scale = .97 + amount * .06;
      el.style.transform = `translateY(${offset.toFixed(2)}px) scale(${scale.toFixed(3)})${el.classList.contains('laptop') ? ' rotate(-7deg)' : ''}`;
    });
    scheduled = false;
  }
  function schedule() {
    if (!scheduled) { requestAnimationFrame(update); scheduled = true; }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  preference.addEventListener('change', schedule);
  if ('IntersectionObserver' in window && !preference.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.remove('pending'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(el => { el.classList.add('pending'); observer.observe(el); });
  }
  // Native details semantics and keyboard behavior, with interruptible height animation.
  document.querySelectorAll('.skill details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation = null;
    let closing = false;
    summary.addEventListener('click', event => {
      if (preference.matches || typeof details.animate !== 'function') return;
      event.preventDefault();
      const opening = animation ? closing : !details.open;
      const startHeight = details.getBoundingClientRect().height;
      if (animation) { animation.cancel(); animation = null; }
      details.open = true;
      const list = details.querySelector('ul');
      const style = getComputedStyle(details);
      const collapsedHeight = summary.getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      const endHeight = opening ? details.getBoundingClientRect().height : collapsedHeight;
      closing = !opening;
      details.classList.toggle('is-closing', closing);
      details.style.overflow = 'hidden';
      animation = details.animate([{ height: `${startHeight}px` }, { height: `${endHeight}px` }], {
        duration: opening ? 420 : 320, easing: 'cubic-bezier(.22,1,.36,1)'
      });
      if (opening) list.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 360, easing: 'ease-out' });
      animation.onfinish = () => {
        details.open = opening;
        details.classList.remove('is-closing');
        details.style.overflow = '';
        animation = null;
        schedule();
      };
    });
    details.addEventListener('toggle', schedule);
  });
  document.fonts?.ready.then(schedule);
  window.addEventListener('load', schedule, { once: true });
  update();
})();

// Exclusive FAQ: native details remains usable with JavaScript disabled.
(() => {
 const items = [...document.querySelectorAll('.faq-list details')];
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 items.forEach(item => {
   item.addEventListener('toggle', () => {
     if (!item.open) return;
     items.forEach(other => { if (other !== item) other.open = false; });
     const answer = item.querySelector('.faq-answer');
     if (!reduced.matches && answer.animate) answer.animate([{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
   });
 });
})();
// One absolute deadline for all visitors. Refreshing never restarts the offer.
(() => {
 const offer = document.querySelector('.workshop-offer');
 if (!offer) return;
 const deadline = Date.parse(offer.dataset.deadline);
 const format = value => String(value).padStart(2, '0').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
 let interval;
 function updateOffer() {
   const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
   const expired = remaining === 0;
   offer.classList.toggle('is-expired', expired);
   offer.querySelector('.offer-current').hidden = !expired;
   offer.querySelector('.offer-ended').hidden = !expired;
   offer.querySelector('.offer-countdown').hidden = expired;
   offer.querySelector('.offer-status').textContent = expired ? 'پیشنهاد پایان‌یافته' : 'پیشنهاد محدود ثبت‌نام';
   const values = {days:Math.floor(remaining/86400),hours:Math.floor(remaining/3600)%24,minutes:Math.floor(remaining/60)%60,seconds:remaining%60};
   Object.entries(values).forEach(([unit,value]) => { offer.querySelector(`[data-unit="${unit}"]`).textContent = format(value); });
   if (expired && interval) clearInterval(interval);
 }
 updateOffer();
 if (Date.now() < deadline) interval = setInterval(updateOffer,1000);
 document.addEventListener('visibilitychange',updateOffer);
 window.addEventListener('pageshow',updateOffer);
})();
// Try Telegram on mobile; preserve the web link as a fallback.
(() => {
 if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
 document.querySelectorAll('a[data-telegram]').forEach(link => {
   link.addEventListener('click', event => {
     if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
     event.preventDefault();
     let fallback;
     const stop = () => { clearTimeout(fallback); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('pagehide',stop); };
     const onVisibility = () => { if (document.hidden) stop(); };
     document.addEventListener('visibilitychange',onVisibility);
     window.addEventListener('pagehide',stop,{once:true});
     fallback = setTimeout(() => { stop(); if (!document.hidden) window.location.assign(link.href); },1800);
     window.location.assign('tg://resolve?domain=' + encodeURIComponent(link.dataset.telegram));
   });
 });
})();
