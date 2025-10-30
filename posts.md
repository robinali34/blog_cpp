---
layout: default
title: "All Posts"
permalink: /posts/
nav_exclude: true
---

<div class="posts-page">
  <header class="page-header">
    <h1 class="page-title">All Posts</h1>
    <p class="page-description">Browse all posts</p>
  </header>

  <!-- Search Section -->
  <div class="search-section">
    <div class="search-container">
      <input type="text" id="searchInput" placeholder="Search posts by title, content, or category..." class="search-input">
      <div class="search-filters" id="dynamicFilters"></div>
    </div>
    <div class="search-results-info">
      <span id="resultsCount">{{ site.posts.size }} posts found</span>
    </div>
  </div>

  {%- if site.posts.size > 0 -%}
    <div class="posts-list" id="postsList">
      {%- for post in site.posts -%}
      <article class="post-item" data-title="{{ post.title | downcase }}" data-excerpt="{{ post.excerpt | strip_html | downcase }}" data-categories="{{ post.categories | join: ' ' | downcase }}" data-tags="{{ post.tags | join: ' ' | downcase }}">
        {%- assign date_format = site.minima.date_format | default: "%b %-d, %Y" -%}
        <div class="post-meta">{{ post.date | date: date_format }}</div>
        <h2 class="post-title">
          <a class="post-link" href="{{ post.url | relative_url }}">
            {{ post.title | escape }}
          </a>
        </h2>
        {%- if post.excerpt -%}
          <div class="post-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</div>
        {%- endif -%}
        {%- if post.categories -%}
          {%- assign unique_categories = post.categories | uniq -%}
          <div class="post-categories">
            {%- for category in unique_categories -%}
              <span class="category-tag">{{ category }}</span>
            {%- endfor -%}
          </div>
        {%- endif -%}
        {%- if post.tags -%}
          {%- assign unique_tags = post.tags | uniq -%}
          <div class="post-tags">
            {%- for tag in unique_tags -%}
              <span class="tag">{{ tag }}</span>
            {%- endfor -%}
          </div>
        {%- endif -%}
      </article>
      {%- endfor -%}
    </div>
  {%- else -%}
    <div class="no-posts">
      <p>No posts found.</p>
    </div>
  {%- endif -%}

  <div class="back-to-home">
    <a href="{{ "/" | relative_url }}" class="btn">← Back to Home</a>
  </div>
</div>

<style>
.posts-page { max-width: 1000px; margin: 0 auto; padding: 0 1rem 2rem; }
.page-header { margin: 1rem 0 1.25rem; }
.page-title { margin: 0; font-size: 2rem; }
.page-description { color: #555; margin-top: 0.25rem; }

.search-section { position: sticky; top: 0; background: #fff; padding: 0.75rem 0; z-index: 5; border-bottom: 1px solid #eee; }
.search-container { display: flex; flex-direction: column; gap: 0.5rem; }
.search-input { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; }
.search-filters { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.filter-btn { padding: 0.25rem 0.6rem; border: 1px solid #ddd; border-radius: 999px; background: #fafafa; color: #444; cursor: pointer; font-size: 0.85rem; }
.filter-btn:hover { background: #f0f0f0; }
.filter-btn.active { background: #0366d6; color: #fff; border-color: #0366d6; }
.search-results-info { margin-top: 0.25rem; color: #666; font-size: 0.9rem; }

.posts-list { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 0.9rem; margin-top: 1rem; }
@media (min-width: 700px) { .posts-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.post-item { border: 1px solid #eaecef; border-radius: 10px; padding: 0.9rem; background: #fff; transition: box-shadow 0.2s ease, transform 0.05s ease; }
.post-item:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.06); transform: translateY(-1px); }
.post-meta { color: #666; font-size: 0.85rem; }
.post-title { margin: 0.2rem 0 0; font-size: 1.05rem; }
.post-link { text-decoration: none; color: #24292e; }
.post-link:hover { text-decoration: underline; }
.post-excerpt { color: #444; margin-top: 0.35rem; line-height: 1.45; }
.post-categories, .post-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
.category-tag, .tag { display: inline-block; padding: 0.12rem 0.45rem; border: 1px solid #e0e0e0; border-radius: 999px; font-size: 0.8rem; color: #555; background: #f8f8f8; }

.back-to-home { text-align: center; margin: 1.5rem 0 0; }
.btn { display: inline-block; padding: 0.5rem 0.9rem; border: 1px solid #ddd; border-radius: 8px; background: #fff; color: #0366d6; text-decoration: none; }
.btn:hover { background: #f6f8fa; }

.no-posts { text-align: center; color: #666; padding: 2rem 0; }
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const filtersHost = document.getElementById('dynamicFilters');
  const postItems = document.querySelectorAll('.post-item');
  const resultsCount = document.getElementById('resultsCount');
  
  let currentFilter = 'all';
  let filterButtons = [];

  function buildFilters() {
    const freq = new Map();
    postItems.forEach(p => {
      const cats = (p.dataset.categories || '').split(/\s+/).filter(Boolean);
      const tags = (p.dataset.tags || '').split(/\s+/).filter(Boolean);
      const all = [...cats, ...tags].map(s => s.toLowerCase());
      const uniq = Array.from(new Set(all));
      uniq.forEach(k => freq.set(k, (freq.get(k) || 0) + 1));
    });
    const entries = Array.from(freq.entries()).sort((a,b) => b[1]-a[1]).slice(0, 24);
    const frag = document.createDocumentFragment();
    const mk = (label, filter, active=false) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (active ? ' active' : '');
      btn.dataset.filter = filter;
      btn.textContent = label;
      btn.addEventListener('click', function(){
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        performSearch();
      });
      return btn;
    };
    frag.appendChild(mk('All', 'all', true));
    entries.forEach(([k, count]) => frag.appendChild(mk(`${k} (${count})`, k)));
    filtersHost.innerHTML = '';
    filtersHost.appendChild(frag);
    filterButtons = Array.from(filtersHost.querySelectorAll('.filter-btn'));
  }
  
  function performSearch() {
    const searchTerm = (searchInput.value || '').toLowerCase();
    let visibleCount = 0;
    
    postItems.forEach(post => {
      const title = post.dataset.title || '';
      const excerpt = post.dataset.excerpt || '';
      const categories = post.dataset.categories || '';
      const tags = post.dataset.tags || '';
      
      const matchesSearch = searchTerm === '' || 
        title.includes(searchTerm) || 
        excerpt.includes(searchTerm) || 
        categories.includes(searchTerm) ||
        tags.includes(searchTerm);
      
      const matchesFilter = currentFilter === 'all' || 
        categories.includes(currentFilter) ||
        tags.includes(currentFilter);
      
      if (matchesSearch && matchesFilter) {
        post.style.display = 'block';
        visibleCount++;
      } else {
        post.style.display = 'none';
      }
    });
    
    resultsCount.textContent = `${visibleCount} posts found`;
  }
  
  buildFilters();
  
  if (searchInput) {
    searchInput.addEventListener('input', performSearch);
  }
  performSearch();
});
</script>


