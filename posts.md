---
layout: default
title: "All Posts"
permalink: /posts/
nav_exclude: true
---

<link rel="stylesheet" href="{{ '/assets/css/morandi-theme.css' | relative_url }}">

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
        {%- if post.categories -%}
          {%- assign unique_categories = post.categories | uniq -%}
        {%- else -%}
          {%- assign unique_categories = '' | split: '' -%}
        {%- endif -%}
        {%- if post.tags -%}
          {%- assign unique_tags = post.tags | uniq -%}
        {%- else -%}
          {%- assign unique_tags = '' | split: '' -%}
        {%- endif -%}
        <div class="post-meta">{{ post.date | date: date_format }}</div>
        <div class="post-link-md">
          [<a href="{{ post.url | absolute_url }}">{{ post.title | escape }}</a>]({{ post.url | absolute_url }})
        </div>
        {%- if post.excerpt -%}
          <div class="post-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</div>
        {%- endif -%}
        {%- if unique_categories.size > 0 -%}
          <div class="post-categories">
            {%- for category in unique_categories -%}
              <span class="category-tag">{{ category }}</span>
            {%- endfor -%}
          </div>
        {%- endif -%}
        {%- if unique_tags.size > 0 -%}
          <div class="post-tags">
            {%- for tag in unique_tags -%}
              {%- unless unique_categories contains tag -%}
                <span class="tag">{{ tag }}</span>
              {%- endunless -%}
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
.posts-page { max-width: 1000px; margin: 0 auto; padding: 0 1rem 2rem; background-color: var(--morandi-bg-primary, #F5F0E8); }
.page-header { margin: 1rem 0 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--morandi-border-light, #E8E3D8); }
.page-title { margin: 0; font-size: 2rem; color: var(--morandi-text-dark, #5A5752); }
.page-description { color: var(--morandi-text-medium, #7A7772); margin-top: 0.25rem; }

.search-section { position: sticky; top: 0; background: var(--morandi-bg-card, #FFFFFF); padding: 0.75rem 0; z-index: 5; border-bottom: 1px solid var(--morandi-border-light, #E8E3D8); }
.search-container { display: flex; flex-direction: column; gap: 0.5rem; }
.search-input { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--morandi-border-light, #E8E3D8); border-radius: 8px; font-size: 0.95rem; background-color: var(--morandi-bg-card, #FFFFFF); color: var(--morandi-text-dark, #5A5752); }
.search-input:focus { border-color: var(--morandi-border-medium, #D4D1CC); outline: none; box-shadow: 0 0 0 3px rgba(232, 227, 216, 0.3); }
.search-filters { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.filter-btn { padding: 0.25rem 0.6rem; border: 1px solid var(--morandi-border-light, #E8E3D8); border-radius: 999px; background: var(--morandi-beige, #E8E3D8); color: var(--morandi-text-medium, #7A7772); cursor: pointer; font-size: 0.85rem; transition: all 0.2s ease; }
.filter-btn:hover { background: var(--morandi-sand, #D9D4C7); border-color: var(--morandi-border-medium, #D4D1CC); }
.filter-btn.active { background: var(--morandi-gray-medium, #B8B5B0); color: var(--morandi-bg-card, #FFFFFF); border-color: var(--morandi-gray-medium, #B8B5B0); }
.search-results-info { margin-top: 0.25rem; color: var(--morandi-text-light, #9A9792); font-size: 0.9rem; }

.posts-list { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 0.9rem; margin-top: 1rem; }
@media (min-width: 700px) { .posts-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.post-item { border: 1px solid var(--morandi-border-light, #E8E3D8); border-radius: 10px; padding: 0.9rem; background: var(--morandi-bg-card, #FFFFFF); transition: box-shadow 0.2s ease, transform 0.05s ease, border-color 0.2s ease; }
.post-item:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); transform: translateY(-1px); border-color: var(--morandi-border-medium, #D4D1CC); }
.post-meta { color: var(--morandi-text-light, #9A9792); font-size: 0.85rem; }
.post-title { margin: 0.2rem 0 0; font-size: 1.05rem; color: var(--morandi-text-dark, #5A5752); }
.post-link { text-decoration: none; color: var(--morandi-text-dark, #5A5752); }
.post-link:hover { text-decoration: underline; }
.post-excerpt { color: var(--morandi-text-medium, #7A7772); margin-top: 0.35rem; line-height: 1.45; }
.post-categories, .post-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
.category-tag, .tag { display: inline-block; padding: 0.12rem 0.45rem; border: 1px solid var(--morandi-border-light, #E8E3D8); border-radius: 999px; font-size: 0.8rem; color: var(--morandi-text-medium, #7A7772); background: var(--morandi-beige, #E8E3D8); transition: all 0.2s ease; }
.category-tag:hover, .tag:hover { background: var(--morandi-sand, #D9D4C7); border-color: var(--morandi-border-medium, #D4D1CC); }
.post-link-md { margin-top: 0.2rem; font-size: 0.95rem; }
.post-link-md a { color: var(--morandi-link, #8B8680); word-break: break-all; text-decoration: none; }
.post-link-md a:hover { color: var(--morandi-link-hover, #6B6660); text-decoration: underline; }

.back-to-home { text-align: center; margin: 1.5rem 0 0; }
.btn { display: inline-block; padding: 0.5rem 0.9rem; border: 1px solid var(--morandi-border-medium, #D4D1CC); border-radius: 8px; background: var(--morandi-bg-card, #FFFFFF); color: var(--morandi-link, #8B8680); text-decoration: none; transition: all 0.2s ease; }
.btn:hover { background: var(--morandi-bg-hover, #F0EBE3); border-color: var(--morandi-border-dark, #B8B5B0); color: var(--morandi-link-hover, #6B6660); }

.no-posts { text-align: center; color: var(--morandi-text-medium, #7A7772); padding: 2rem 0; }
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


