document.documentElement.classList.add('js');
const languageButtons = document.querySelectorAll('[data-language]');
const languageCopy = {
  en: { title: 'Wenting Huang | Personal Homepage', cvTitle: 'Wenting Huang | Full CV', description: 'Wenting Huang, MPhil student in Artificial Intelligence at The Chinese University of Hong Kong, Shenzhen, a member of HLT Lab advised by Prof. Haizhou Li. Current research focuses on AI applications in education.', copied: 'Copied', copyError: 'Select the address to copy' },
  'zh-Hans': { title: '黄文婷 | 个人主页', cvTitle: '黄文婷 | 完整履历', description: '黄文婷，香港中文大学（深圳）人工智能哲学硕士在读，HLT Lab 成员，导师为李海洲教授。目前主要研究 AI 在教育中的应用。', copied: '已复制', copyError: '请选中邮箱手动复制' },
  fr: { title: 'Wenting Huang | Page personnelle', cvTitle: 'Wenting Huang | CV complet', description: 'Wenting Huang, étudiante en MPhil en intelligence artificielle à The Chinese University of Hong Kong, Shenzhen, membre du HLT Lab sous la direction du Pr Haizhou Li. Ses recherches portent sur les applications de l’IA à l’éducation.', copied: 'Copié', copyError: 'Sélectionnez l’adresse pour la copier' }
};
function setLanguage(language) {
  const selected = Object.hasOwn(languageCopy, language) ? language : 'en';
  document.documentElement.lang = selected;
  const copy = languageCopy[selected];
  document.title = document.documentElement.dataset.page === 'cv' ? copy.cvTitle : copy.title;
  document.querySelector('meta[name="description"]').content = copy.description;
  languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === selected)));
}
languageButtons.forEach(button => button.addEventListener('click', () => {
  setLanguage(button.dataset.language);
  const url = new URL(window.location.href);
  if (button.dataset.language === 'en') url.searchParams.delete('lang');
  else url.searchParams.set('lang', button.dataset.language);
  try { window.history.replaceState(null, '', url); } catch { /* Language switching also works for local files. */ }
}));
setLanguage(new URLSearchParams(window.location.search).get('lang') || 'en');

// Keep the navigation tied to the section currently being read.
const sectionLinks = [...document.querySelectorAll('.navigation a')];
const sections = sectionLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const navigation = document.querySelector('.navigation');
const header = document.querySelector('.topbar');
let headerHeight = header?.getBoundingClientRect().height || 75;
function measureHeader() {
  headerHeight = header?.getBoundingClientRect().height || 75;
  document.documentElement.style.setProperty('--header-height', `${Math.ceil(headerHeight)}px`);
  updateActiveSection();
}
const readingTab = document.createElement('span');
readingTab.className = 'nav-reading-tab';
readingTab.setAttribute('aria-hidden', 'true');
navigation?.append(readingTab);
function positionReadingTab() {
  const current = navigation?.querySelector('[aria-current="location"]');
  if (!current || !current.offsetWidth) return;
  navigation.style.setProperty('--tab-x', `${current.offsetLeft - 5}px`);
  navigation.style.setProperty('--tab-y', `${current.offsetTop + 2}px`);
  navigation.style.setProperty('--tab-width', `${current.offsetWidth + 10}px`);
  navigation.style.setProperty('--tab-height', `${current.offsetHeight + 1}px`);
  navigation.dataset.tabReady = '';
}

function updateActiveSection() {
  // Separate thresholds keep the header from oscillating as its height changes.
  if (header) {
    const compact = header.classList.contains('is-compact');
    if (!compact && window.scrollY > 160) header.classList.add('is-compact');
    else if (compact && window.scrollY < 70) header.classList.remove('is-compact');
    const measured = header.getBoundingClientRect().height;
    if (measured !== headerHeight) {
      headerHeight = measured;
      document.documentElement.style.setProperty('--header-height', `${Math.ceil(measured)}px`);
    }
  }
  const position = window.scrollY + headerHeight + 36;
  const active = [...sections].reverse().find(section => section.getBoundingClientRect().top + window.scrollY <= position) || sections[0];
  sectionLinks.forEach(link => {
    if (active && link.getAttribute('href') === `#${active.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  positionReadingTab();
}
let navigationFrame = false;
window.addEventListener('scroll', () => {
  if (navigationFrame) return;
  navigationFrame = true;
  requestAnimationFrame(() => { updateActiveSection(); navigationFrame = false; });
}, { passive: true });
window.addEventListener('resize', measureHeader);
languageButtons.forEach(button => button.addEventListener('click', measureHeader));
measureHeader();
if (header && 'ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);
if (navigation && 'ResizeObserver' in window) new ResizeObserver(positionReadingTab).observe(navigation);
document.fonts?.ready.then(measureHeader);

// Motion is an enhancement: the document stays fully visible without it.
(() => {
  if (!('animate' in Element.prototype) || !window.matchMedia) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealed = new WeakSet();
  const animations = new Set();
  const heroElements = [...document.querySelectorAll('.hero-copy, .portrait')];
  const readingElements = [...document.querySelectorAll('.school-row, .publication, .project, .experience-timeline')];
  let observer;

  function reveal(element, delay = 0) {
    if (revealed.has(element) || reducedMotion.matches || document.hidden) return;
    revealed.add(element);
    const transform = getComputedStyle(element).transform;
    const restingTransform = transform === 'none' ? '' : transform;
    const animation = element.animate([
      { opacity: 0.55, transform: `${restingTransform} translateY(10px)` },
      { opacity: 1, transform: `${restingTransform} translateY(0)` }
    ], {
      duration: 450,
      delay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'backwards'
    });
    animations.add(animation);
    animation.addEventListener('finish', () => animations.delete(animation), { once: true });
    animation.addEventListener('cancel', () => animations.delete(animation), { once: true });
  }

  function updateMotion() {
    observer?.disconnect();
    if (reducedMotion.matches || document.hidden) {
      animations.forEach(animation => animation.cancel());
      animations.clear();
      return;
    }
    heroElements.forEach((element, index) => reveal(element, index * 70));
    if (!('IntersectionObserver' in window)) return;
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        let stagger = 0;
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          reveal(entry.target, Math.min(stagger * 55, 150));
          stagger += 1;
          if (revealed.has(entry.target)) observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    }
    readingElements.forEach(element => {
      if (!revealed.has(element)) observer.observe(element);
    });
  }

  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', updateMotion);
  else reducedMotion.addListener(updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
})();

// Copy only on an explicit click; keep the mail link as the normal contact action.
document.querySelectorAll('[data-copy-email]').forEach(button => {
  const feedback = button.parentElement.querySelector('.copy-feedback');
  let resetTimer;
  button.addEventListener('click', async () => {
    clearTimeout(resetTimer);
    button.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      button.dataset.copied = 'true';
      feedback.textContent = languageCopy[document.documentElement.lang].copied;
    } catch {
      delete button.dataset.copied;
      feedback.textContent = languageCopy[document.documentElement.lang].copyError;
    } finally {
      button.disabled = false;
      resetTimer = setTimeout(() => {
        delete button.dataset.copied;
        feedback.textContent = '';
      }, button.dataset.copied ? 2400 : 5000);
    }
  });
  languageButtons.forEach(languageButton => languageButton.addEventListener('click', () => {
    clearTimeout(resetTimer);
    delete button.dataset.copied;
    feedback.textContent = '';
  }));
});
// A bookmark excursion is reversible; no reading history is stored remotely.
const bookmarkLink = document.querySelector('.bookmark-link');
const returnButton = document.querySelector('.reading-return');
let readingPosition;
bookmarkLink?.addEventListener('click', () => {
  readingPosition = { y: window.scrollY, hash: window.location.hash };
  returnButton.hidden = false;
  document.querySelector('#outside-research')?.focus({ preventScroll: true });
});
returnButton?.addEventListener('click', () => {
  if (!readingPosition) return;
  const saved = readingPosition;
  readingPosition = undefined;
  returnButton.hidden = true;
  const url = new URL(window.location.href);
  url.hash = saved.hash;
  try { window.history.replaceState(null, '', url); } catch { /* Local file preview. */ }
  bookmarkLink.focus({ preventScroll: true });
  window.scrollTo({ top: saved.y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});

// Native dialog provides focus containment and Escape-to-close behavior.
const portraitLink = document.querySelector('.portrait-open');
const portraitDialog = document.querySelector('.portrait-dialog');
if (portraitDialog && typeof portraitDialog.showModal === 'function') {
  portraitLink.addEventListener('click', event => {
    event.preventDefault();
    portraitDialog.showModal();
    document.body.classList.add('portrait-is-open');
  });
  portraitDialog.querySelector('.portrait-close').addEventListener('click', () => portraitDialog.close());
  portraitDialog.addEventListener('click', event => {
    const rect = portraitDialog.getBoundingClientRect();
    if (event.target === portraitDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) portraitDialog.close();
  });
  portraitDialog.addEventListener('close', () => {
    document.body.classList.remove('portrait-is-open');
    portraitLink.focus({ preventScroll: true });
  });
}
