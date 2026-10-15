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
