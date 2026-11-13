/* NOCO ONEMAN LIVE「I am」 mobile LP */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // iOS Safari で :active（CTA押下状態）を有効にする
  document.addEventListener('touchstart', () => {}, { passive: true });

  /* ---------- トースト ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2200);
  };

  /* ---------- 未確定リンク ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-pending]');
    if (!a) return;
    e.preventDefault();
    toast('リンク先は後日公開です');
  });

  /* ---------- ページ内スクロール ---------- */
  const scrollToHash = (hash) => {
    const target = hash === '#top' ? document.body : document.querySelector(hash);
    if (!target) return;
    if (hash === '#top') window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', hash);
  };

  /* ---------- 状態B：メニュー ---------- */
  const menu = $('#menu');
  const menuBtn = $('#menuBtn');
  const inertTargets = [$('main'), $('.footer')];
  let menuOpen = false;

  const setMenu = (open) => {
    menuOpen = open;
    root.classList.toggle('is-menu-open', open);
    root.classList.toggle('is-locked', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    inertTargets.forEach((el) => { if (el) el.inert = open; });
    if (open) {
      menu.hidden = false;
      menu.classList.add('is-entering');
      menu.addEventListener('animationend', () => menu.classList.remove('is-entering'), { once: true });
      const first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    } else {
      menu.hidden = true;
    }
  };

  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); }
  });
  // 項目タップ：メニューを閉じてから該当セクションへ
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-pending')) return;
    e.preventDefault();
    setMenu(false);
    requestAnimationFrame(() => scrollToHash(a.getAttribute('href')));
  });

  /* ---------- 02 MESSAGE：ブロックを順にフェードイン ---------- */
  const reveals = $$('#message [data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-lit'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-lit');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- 07 FAQ アコーディオン ---------- */
  $$('.faq__q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      panel.hidden = !open;
      btn.closest('.faq__item').classList.toggle('is-open', open);
    });
  });

  /* ---------- 08 SHARE ---------- */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      ta.remove();
      return ok;
    }
  };

  const tagBtn = $('#hashtag');
  const tag = tagBtn.dataset.tag;
  tagBtn.addEventListener('click', async () => {
    toast((await copyText(tag)) ? `${tag} をコピーしました` : 'コピーできませんでした');
  });

  const canonical = $('link[rel="canonical"]');
  const pageUrl = canonical && !/example\.com/.test(canonical.href) ? canonical.href : location.href.split('#')[0];
  const shareText = 'NOCO ONEMAN LIVE「I am」2026.12.20 SUN PLUSWIN HALL OSAKA';
  $$('[data-share]').forEach((a) => {
    const type = a.dataset.share;
    if (type === 'x') {
      a.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}&hashtags=${encodeURIComponent(tag.replace('#', ''))}`;
    } else if (type === 'line') {
      a.href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}`;
    } else if (type === 'instagram') {
      a.addEventListener('click', () => { copyText(`${tag} ${pageUrl}`).then((ok) => ok && toast('ハッシュタグとURLをコピーしました')); });
    }
  });
})();
