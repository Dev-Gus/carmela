// Gallery masonry: places each photo into whichever column is currently
// shortest, so columns end up close to equal height (unlike CSS
// multi-column, which balances by whole photos and often leaves a gap
// at the bottom of one column). Column height per photo is computed
// from its width/height attributes rather than waiting for the image
// to load, so layout runs synchronously on parse with no flash and no
// load-event timing to get wrong. Runs once up front, then again
// (debounced) on resize so it stays correct as the column count
// changes at the 480px/768px breakpoints.
//
// Photos are placed tallest-relative-to-width first, not curation
// order. This is the standard fix for shortest-column-first placement:
// deciding "which column is shortest" in arbitrary order has no
// foresight, so two tall photos can land in the same column before a
// short one arrives to even things out, leaving a gap that can't be
// closed later. Placing the tall photos first and letting shorter ones
// fill in afterwards (the "longest processing time" rule for this exact
// class of balancing problem) keeps columns markedly closer in height.
// It won't reach a mathematically perfect balance with only a handful
// of photos of uneven size — that residual gap shrinks as more photos
// are added — but it's a meaningful, principled improvement over
// placing photos in whatever order they happen to appear in the grid.
(function(){
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;
  const items = Array.from(grid.querySelectorAll('img.gallery-photo'))
    .sort((a, b) => {
      const arA = (parseInt(a.getAttribute('height'), 10) || 1) / (parseInt(a.getAttribute('width'), 10) || 1);
      const arB = (parseInt(b.getAttribute('height'), 10) || 1) / (parseInt(b.getAttribute('width'), 10) || 1);
      return arB - arA;
    });
  const GAP = 16; // matches the 1rem gap set in CSS

  function columnCount(){
    const w = window.innerWidth;
    if (w >= 768) return 3;
    if (w >= 480) return 2;
    return 1;
  }

  function layoutMasonry(){
    const cols = columnCount();
    const containerWidth = grid.clientWidth;
    const colWidth = (containerWidth - GAP * (cols - 1)) / cols;
    const colEls = Array.from({length: cols}, () => {
      const col = document.createElement('div');
      col.className = 'gallery-col';
      return col;
    });
    const colHeights = new Array(cols).fill(0);

    items.forEach(img => {
      const w0 = parseInt(img.getAttribute('width'), 10) || 1;
      const h0 = parseInt(img.getAttribute('height'), 10) || 1;
      const renderedHeight = colWidth * (h0 / w0);
      let shortest = 0;
      for (let i = 1; i < cols; i++){
        if (colHeights[i] < colHeights[shortest]) shortest = i;
      }
      colEls[shortest].appendChild(img);
      colHeights[shortest] += renderedHeight + GAP;
    });

    grid.replaceChildren(...colEls);
  }

  layoutMasonry();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutMasonry, 150);
  });
})();

const els = document.querySelectorAll('.fade-up');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); } });
}, {threshold:0.15});
els.forEach(el=>io.observe(el));

const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

function openMenu(){
  mobileMenu.classList.add('open');
  mobileMenu.removeAttribute('inert');
  mobileMenu.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
}
function closeMenu(){
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('inert', '');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
}
menuToggle.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});
document.addEventListener('click', (e) => {
  if (!mobileMenu.classList.contains('open')) return;
  if (mobileMenu.contains(e.target) || menuToggle.contains(e.target)) return;
  closeMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
});

document.getElementById('logo-home').addEventListener('click', (e) => {
  e.preventDefault();
  if (mobileMenu.classList.contains('open')) closeMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
let currentIndex = 0;

function showImage(index) {
  currentIndex = (index + galleryItems.length) % galleryItems.length;
  const img = galleryItems[currentIndex];
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
}
function openLightbox(index) {
  showImage(index);
  lightbox.classList.add('show');
  document.documentElement.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('show');
  lightboxImg.src = '';
  document.documentElement.style.overflow = '';
}

galleryItems.forEach((img, index) => {
  img.addEventListener('click', () => openLightbox(index));
  img.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(index);
    }
  });
});
lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => showImage(currentIndex - 1));
lightboxNext.addEventListener('click', () => showImage(currentIndex + 1));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('show')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
  if (e.key === 'ArrowRight') showImage(currentIndex + 1);
});
