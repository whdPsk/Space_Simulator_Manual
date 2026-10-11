(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('#theme');
  const setTheme = value => { root.dataset.theme = value; themeButton.textContent = value === 'dark' ? '밝은 화면으로 전환' : '어두운 화면으로 전환'; };
  let saved;
  try { saved = localStorage.getItem('research.theme'); } catch (_) {}
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeButton.addEventListener('click', () => { const next = root.dataset.theme === 'dark' ? 'light' : 'dark'; setTheme(next); try { localStorage.setItem('research.theme', next); } catch (_) {} });
  const chapters = [...document.querySelectorAll('.chapter')];
  const search = document.querySelector('#search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLocaleLowerCase(); let count = 0;
    chapters.forEach(section => { section.hidden = !!q && !section.textContent.toLocaleLowerCase().includes(q); if (!section.hidden) count++; });
    document.querySelector('#no-results').hidden = count > 0;
    document.querySelector('#search-status').textContent = q ? `${count}개 문서 섹션` : '전체 문서';
  });
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => { search.value = ''; search.dispatchEvent(new Event('input')); }));
  document.querySelectorAll('pre:not(.tree)').forEach(pre => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'copy'; b.textContent = '명령 복사';
    b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(pre.querySelector('code').textContent); b.textContent = '복사 완료'; } catch (_) { b.textContent = '텍스트를 선택해 복사하세요'; } setTimeout(() => b.textContent = '명령 복사', 2200); }); pre.append(b);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) document.querySelectorAll('nav a').forEach(a => { const active = a.hash === '#' + entry.target.id; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); }), {rootMargin: '-5% 0px -65% 0px'});
    chapters.forEach(s => observer.observe(s));
  }
  document.querySelector('#print').addEventListener('click', () => { search.value = ''; search.dispatchEvent(new Event('input')); document.querySelectorAll('details').forEach(d => d.open = true); window.print(); });
})();
