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
      <div class="search-filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="cpp">C++</button>
        <button class="filter-btn" data-filter="system-design">System Design</button>
        <button class="filter-btn" data-filter="multithreading">Multithreading</button>
        <button class="filter-btn" data-filter="concurrency">Concurrency</button>
        <button class="filter-btn" data-filter="mqtt">MQTT</button>
        <button class="filter-btn" data-filter="ble">BLE</button>
        <button class="filter-btn" data-filter="postgresql">PostgreSQL</button>
        <button class="filter-btn" data-filter="sql">SQL</button>
        <button class="filter-btn" data-filter="stl">STL</button>
        <button class="filter-btn" data-filter="shared_ptr">shared_ptr</button>
        <button class="filter-btn" data-filter="mutex">mutex</button>
        <button class="filter-btn" data-filter="atomic">atomic</button>
      </div>
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
          <div class="post-categories">
            {%- for category in post.categories -%}
              <span class="category-tag">{{ category }}</span>
            {%- endfor -%}
          </div>
        {%- endif -%}
        {%- if post.tags -%}
          <div class="post-tags">
            {%- for tag in post.tags -%}
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

<script>
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const postItems = document.querySelectorAll('.post-item');
  const resultsCount = document.getElementById('resultsCount');
  
  let currentFilter = 'all';
  
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
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      performSearch();
    });
  });
  
  if (searchInput) {
    searchInput.addEventListener('input', performSearch);
  }
  performSearch();
});
</script>


