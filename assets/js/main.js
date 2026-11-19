/* NOCO ONEMAN LIVE「I am」 mobile LP */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- ローディング ---------- */
  // 演出（約1.8秒）とページ読み込みの両方が済んだら閉じる。読み込みが遅くても最長4秒で閉じる
  const loader = $('#loader');
  if (loader && root.classList.contains('is-loading')) {
    const MIN = 1800, MAX = 4000;
    const start = performance.now();
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      loader.classList.add('is-leaving');
      root.classList.remove('is-loading');
      try { sessionStorage.setItem('noco-loaded', '1'); } catch (_) {}
      setTimeout(() => loader.remove(), 600);
    };
    const onLoad = () => setTimeout(close, Math.max(0, MIN - (performance.now() - start)));
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    setTimeout(close, MAX);
  } else if (loader) {
    loader.remove();
  }

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

  /* ---------- スクロール連動の表示演出 ---------- */
  // パーツの役割ごとに動きを変える（見た目は style.css の [data-reveal] を参照）
  //   head    … 見出し：タイトルを左からワイプ → サブ → 炎ハート
  //   rule    … 区切り線：左から伸びる
  //   stagger … リスト類：子要素を順にずらして表示
  //   fade    … 本文・カード・画像：下からふわっと表示（MESSAGE の画像も同じ）
  const revealTypes = {
    head: '.sec-head',
    rule: '.grad-rule',
    stagger: '.info__list, .ticket__buy, .sns, .faq__list, .share__btns',
    fade: '.info__date, .sub-label, .tcard, .ticket__note, .profile__photo, .profile__text, .mv, .access__info, .map, .share__tag',
  };
  Object.entries(revealTypes).forEach(([type, sel]) => {
    $$(sel, $('main')).forEach((el) => {
      if (el.dataset.reveal) return;
      el.dataset.reveal = type;
      if (type === 'stagger') Array.from(el.children).forEach((child, i) => child.style.setProperty('--i', i));
    });
  });

  const reveals = $$('main [data-reveal]');
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

  /* ---------- PC：右パネルのナビで表示中のセクションを強調 ---------- */
  const pcLinks = $$('.pc-nav a');
  if (pcLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(pcLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const visible = new Set();
    const update = () => {
      // 表示中のうち最も上にあるセクションを現在地とする
      const current = [...byId.keys()].find((id) => visible.has(id));
      pcLinks.forEach((a) => a.classList.toggle('is-current', a === byId.get(current)));
    };
    const navIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
      update();
    }, { rootMargin: '-40% 0px -55% 0px' });
    byId.forEach((_, id) => { const sec = document.getElementById(id); if (sec) navIo.observe(sec); });
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
