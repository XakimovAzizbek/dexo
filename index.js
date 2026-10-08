/* ============================================================
   DEXO — loyihalar yuklash va ko‘rsatish
   ============================================================ */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupSmoothScroll();

  try {
    const projects = await loadProjects();
    renderProjects(projects);
    updateStats(projects.length);
    hideLoading();
    setupRevealAnimation();
  } catch (err) {
    console.error(err);
    showError(err);
  }
}

/* ---------- TXT faylni o‘qish ---------- */
async function loadProjects() {
  const res = await fetch('loyihalar.txt', { cache: 'no-store' });
  if (!res.ok) throw new Error('loyihalar.txt topilmadi (status: ' + res.status + ')');
  const text = await res.text();
  return parseProjects(text);
}

/* ---------- Matnni obyektlarga aylantirish ---------- */
function parseProjects(text) {
  const lines = text.split(/\r?\n/);
  const projects = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const idx = line.indexOf(':');
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === 'nom') {
      if (current) projects.push(current);
      current = { nom: value, tavsif: '', rasm: '', link: '' };
    } else if (current) {
      if (key === 'tavsif') current.tavsif = value;
      else if (key === 'rasm') current.rasm = value;
      else if (key === 'link') current.link = value;
    }
  }

  if (current) projects.push(current);
  return projects;
}

/* ---------- Kartochkalarni chizish ---------- */
function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = '';

  if (!projects.length) {
    grid.innerHTML = '<div class="loading">Hozircha loyihalar yo‘q.</div>';
    return;
  }

  projects.forEach(p => grid.appendChild(createCard(p)));
}

function createCard(p) {
  const hasLink = p.link && p.link.trim() !== '' && p.link !== '#';
  const card = document.createElement(hasLink ? 'a' : 'div');
  card.className = 'project-card';

  if (hasLink) {
    card.href = p.link;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
  }

  /* Tag: "DEXO GTA" -> "GTA" */
  const tagText = p.nom.replace(/^DEXO\s*/i, '').trim() || 'LOYIHA';

  /* Rasm qismi */
  const imageWrap = document.createElement('div');
  imageWrap.className = 'project-image';

  if (p.rasm) {
    const img = document.createElement('img');
    img.src = p.rasm;
    img.alt = p.nom;
    img.loading = 'lazy';
    img.onerror = () => {
      imageWrap.innerHTML = '<div class="fallback-icon">📦</div>';
    };
    imageWrap.appendChild(img);
  } else {
    imageWrap.innerHTML = '<div class="fallback-icon">📦</div>';
  }

  /* Matn qismi */
  const body = document.createElement('div');
  body.className = 'project-body';

  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = tagText;

  const title = document.createElement('h3');
  title.textContent = p.nom;

  const desc = document.createElement('p');
  desc.textContent = p.tavsif || 'Tavsif kiritilmagan.';

  const status = document.createElement('div');
  status.className = 'status';
  status.innerHTML = '<span class="status-dot"></span> Faol';

  body.appendChild(tag);
  body.appendChild(title);
  body.appendChild(desc);
  body.appendChild(status);

  card.appendChild(imageWrap);
  card.appendChild(body);

  return card;
}

/* ---------- Statistika ---------- */
function updateStats(count) {
  const el = document.getElementById('statProjects');
  if (el) el.textContent = count;
}

/* ---------- Loading / Error ---------- */
function hideLoading() {
  const el = document.getElementById('projectsLoading');
  if (el) el.style.display = 'none';
}

function showError(err) {
  hideLoading();
  const box = document.getElementById('projectsError');
  if (!box) return;

  box.style.display = 'block';
  box.innerHTML = `
    <b>⚠️ Loyihalarni yuklab bo‘lmadi</b><br><br>
    Sabab: ${escapeHtml(err.message)}<br><br>
    <b>Yechim:</b> sahifani <code>file://</code> orqali emas, balki lokal server orqali oching:<br>
    <code>python -m http.server 8000</code><br>
    yoki VS Code’da <b>Live Server</b> kengaytmasidan foydalaning.
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- Smooth scroll ---------- */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ---------- Paydo bo‘lish animatsiyasi ---------- */
function setupRevealAnimation() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.project-card, .stat-box').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(el);
  });
}