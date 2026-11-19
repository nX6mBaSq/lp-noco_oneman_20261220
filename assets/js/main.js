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
  // ローディングが閉じたら解決する（スクロール演出をローディングの裏で消化しないため）
  let onLoaderClosed;
  const loaderClosed = new Promise((resolve) => { onLoaderClosed = resolve; });
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
      setTimeout(() => loader.remove(), 650);
      // フェードアウトが半分ほど進んだところで演出を開始し、自然につなげる
      setTimeout(onLoaderClosed, 250);
    };
    const onLoad = () => setTimeout(close, Math.max(0, MIN - (performance.now() - start)));
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    setTimeout(close, MAX);
  } else {
    if (loader) loader.remove();
    onLoaderClosed();
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
  let menuTimer;
  // タイル・下部ブロックを順に浮かせるための番号
  [...$$('.menu__list > li', menu), $('.menu__bottom', menu)].forEach((el, i) => el && el.style.setProperty('--i', i));

  const setMenu = (open) => {
    menuOpen = open;
    root.classList.toggle('is-menu-open', open);
    root.classList.toggle('is-locked', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    inertTargets.forEach((el) => { if (el) el.inert = open; });
    clearTimeout(menuTimer);
    menu.classList.remove('is-entering', 'is-leaving');
    if (open) {
      menu.hidden = false;
      void menu.offsetWidth; // 連打時もアニメーションを最初から再生させる
      menu.classList.add('is-entering');
      menuTimer = setTimeout(() => menu.classList.remove('is-entering'), 900);
      const first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    } else if (reduceMotion) {
      menu.hidden = true;
    } else {
      // 短いフェードアウトのあとに非表示
      menu.classList.add('is-leaving');
      menuTimer = setTimeout(() => { menu.hidden = true; menu.classList.remove('is-leaving'); }, 220);
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
  // MESSAGE の画像（index.html で data-reveal を付与）だけ、下からふわっと表示する。
  // それ以外のセクションは演出なしで最初から表示（見出しの炎ハートは style.css で常に揺れる）
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
    // ローディングの裏で演出を消化しないよう、ローディングが閉じてから監視を始める
    loaderClosed.then(() => reveals.forEach((el) => io.observe(el)));
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
  // 高さを 0 ⇔ 中身の高さで補間し、文字は少し遅れてフェード（瞬時に開閉しないように）
  $$('.faq__q').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    let anim;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.closest('.faq__item').classList.toggle('is-open', open);
      if (reduceMotion || !panel.animate) { panel.hidden = !open; return; }

      // 途中で切り替えた場合は現在の高さから続ける
      const from = panel.hidden ? 0 : panel.getBoundingClientRect().height;
      if (anim) anim.cancel();
      panel.hidden = false;
      const to = open ? panel.scrollHeight : 0;
      // 下余白（padding）があると高さ 0 まで縮まないので、余白も一緒に補間する
      const pb = getComputedStyle(panel).paddingBottom;
      anim = panel.animate(
        open
          ? [{ height: `${from}px`, paddingBottom: from ? pb : '0px', opacity: from ? 1 : 0 }, { height: `${to}px`, paddingBottom: pb, opacity: 1 }]
          : [{ height: `${from}px`, paddingBottom: pb, opacity: 1 }, { height: '0px', paddingBottom: '0px', opacity: 0 }],
        { duration: open ? 420 : 320, easing: open ? 'cubic-bezier(.22, 1, .36, 1)' : 'cubic-bezier(.4, 0, .2, 1)' }
      );
      anim.onfinish = () => { anim = null; if (!open) panel.hidden = true; };
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
