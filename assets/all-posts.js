/* global document, window */
(function () {
  function parsePosts() {
    const script = document.getElementById('posts-data');
    try {
      return JSON.parse(script.textContent || '[]');
    } catch (e) {
      return [];
    }
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function uniqueSortedCategories(posts) {
    const set = new Set();
    posts.forEach(p => (p.categories || []).forEach(c => set.add(String(c))));
    return Array.from(set).sort();
  }

  function render(posts, { pageSize, page, query, category }) {
    const list = document.getElementById('posts-list');
    const pagination = document.getElementById('pagination');
    const resultsMeta = document.getElementById('results-meta');
    const q = (query || '').trim().toLowerCase();
    const cat = (category || '').trim().toLowerCase();

    const filtered = posts.filter(p => {
      const inTitle = !q || (p.title || '').toLowerCase().includes(q);
      const inCat = !cat || (p.categories || []).map(String).some(c => c.toLowerCase() === cat);
      return inTitle && inCat;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(Math.max(1, page), totalPages);
    const start = (current - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    if (resultsMeta) {
      const total = filtered.length;
      const rangeFrom = total ? (start + 1) : 0;
      const rangeTo = start + slice.length;
      resultsMeta.textContent = total + ' posts found' + (total ? (' · showing ' + rangeFrom + '–' + rangeTo) : '');
    }

    list.innerHTML = slice.map(p => {
      const cats = (p.categories || []).map(c => '<span class="chip" title="Category">' + c + '</span>').join('');
      const tags = (p.tags || []).map(t => '<span class="chip" title="Tag">#' + t + '</span>').join('');
      const chips = (cats || tags) ? ('<div class="chips">' + cats + tags + '</div>') : '';
      const excerpt = p.excerpt ? ('<div class="post-excerpt">' + p.excerpt + '</div>') : '';
      return (
        '<div class="post-item">'
        + '<div class="post-title"><a href="' + p.url + '">' + p.title + '</a></div>'
        + '<div class="post-meta">' + formatDate(p.date) + '</div>'
        + excerpt
        + chips
        + '</div>'
      );
    }).join('');

    // Pagination controls
    const makeBtn = (label, targetPage, disabled, active) => {
      const tag = 'button';
      return '<' + tag + (
        ' data-page="' + targetPage + '"'
        + (disabled ? ' class="disabled"' : (active ? ' class="active"' : ''))
      ) + '>' + label + '</' + tag + '>';
    };

    let html = '';
    html += makeBtn('Prev', current - 1, current <= 1, false);

    // Show a compact range of pages
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let from = Math.max(1, current - half);
    let to = Math.min(totalPages, from + windowSize - 1);
    from = Math.max(1, Math.min(from, to - windowSize + 1));

    for (let i = from; i <= to; i++) {
      html += makeBtn(String(i), i, false, i === current);
    }

    html += makeBtn('Next', current + 1, current >= totalPages, false);
    pagination.innerHTML = html;

    // Wire up clicks
    pagination.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = Number(btn.getAttribute('data-page'));
        if (!Number.isNaN(target)) {
          updateState({ page: target });
        }
      });
    });

    // Empty state
    if (!filtered.length) {
      list.innerHTML = '<div>No posts found.</div>';
      pagination.innerHTML = '';
    }
  }

  function readState() {
    const params = new URLSearchParams(window.location.search);
    return {
      query: params.get('q') || '',
      category: params.get('c') || '',
      page: Number(params.get('p') || '1')
    };
  }

  function writeStateToUrl(state) {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.category) params.set('c', state.category);
    if (state.page && state.page !== 1) params.set('p', String(state.page));
    const q = params.toString();
    const url = window.location.pathname + (q ? ('?' + q) : '');
    window.history.replaceState(null, '', url);
  }

  let POSTS = [];
  let UI = { search: null, category: null, pageSize: null, clear: null };
  let STATE = { query: '', category: '', page: 1, pageSize: 10 };

  function updateState(partial) {
    STATE = Object.assign({}, STATE, partial);
    if (partial.query !== undefined || partial.category !== undefined) {
      STATE.page = 1; // reset page on filter change
    }
    writeStateToUrl(STATE);
    render(POSTS, { pageSize: STATE.pageSize, page: STATE.page, query: STATE.query, category: STATE.category });
  }

  function init() {
    POSTS = parsePosts();
    UI.search = document.getElementById('search-input');
    UI.category = document.getElementById('category-select');
    UI.pageSize = document.getElementById('page-size');
    UI.clear = document.getElementById('clear-filters');

    // Initialize state from URL
    const initial = readState();
    STATE = { query: initial.query, category: initial.category, page: initial.page || 1, pageSize: Number(initial.pageSize || 10) };

    // Set UI from state
    if (UI.search) UI.search.value = STATE.query;
    if (UI.category) UI.category.value = STATE.category;
    if (UI.pageSize) UI.pageSize.value = String(STATE.pageSize);

    // Wire events
    if (UI.search) {
      let timer = null;
      UI.search.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => updateState({ query: UI.search.value }), 120);
      });
    }
    if (UI.category) {
      UI.category.addEventListener('change', () => updateState({ category: UI.category.value }));
    }
    if (UI.pageSize) {
      UI.pageSize.addEventListener('change', () => updateState({ pageSize: Number(UI.pageSize.value), page: 1 }));
    }
    if (UI.clear) {
      UI.clear.addEventListener('click', () => {
        if (UI.search) UI.search.value = '';
        if (UI.category) UI.category.value = '';
        updateState({ query: '', category: '', page: 1 });
      });
    }

    // First render
    render(POSTS, { pageSize: STATE.pageSize, page: STATE.page, query: STATE.query, category: STATE.category });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


