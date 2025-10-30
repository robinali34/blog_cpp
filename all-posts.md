---
layout: page
title: All Posts
permalink: /all/
---

<div class="all-posts-controls">
  <input id="search-input" type="search" placeholder="Search titles..." aria-label="Search titles" />
  <select id="category-select" aria-label="Filter by category">
    <option value="">All categories</option>
    {% assign all_categories = site.posts | map: 'categories' | compact | uniq | join: ',' | split: ',' | sort %}
    {% assign seen = '' %}
    {% for cat in all_categories %}
      {% assign c = cat | strip %}
      {% if c != '' %}
        {% unless seen contains c %}
          <option value="{{ c }}">{{ c }}</option>
          {% assign seen = seen | append: ',' | append: c %}
        {% endunless %}
      {% endif %}
    {% endfor %}
  </select>
  <select id="page-size" aria-label="Results per page">
    <option value="10">10 / page</option>
    <option value="20">20 / page</option>
    <option value="50">50 / page</option>
  </select>
  <button id="clear-filters" type="button">Clear</button>
</div>

<div id="results-meta" class="results-meta" aria-live="polite"></div>

<div id="posts-list"></div>

<nav id="pagination" class="pagination" aria-label="Posts pagination"></nav>

<script id="posts-data" type="application/json">
[
{% assign posts_sorted = site.posts | sort: 'date' | reverse %}
{% for post in posts_sorted %}
  {
    "title": {{ post.title | jsonify }},
    "url": {{ post.url | relative_url | jsonify }},
    "date": {{ post.date | date_to_xmlschema | jsonify }},
    "categories": {{ post.categories | default: [] | jsonify }},
    "tags": {{ post.tags | default: [] | jsonify }},
    "excerpt": {{ post.excerpt | default: '' | strip_html | strip_newlines | truncate: 220 | jsonify }}
  }{% unless forloop.last %},{% endunless %}
{% endfor %}
]
</script>

<script src="{{ '/assets/all-posts.js' | relative_url }}" defer></script>

<style>
.all-posts-controls { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
#posts-list .post-item { padding: 0.5rem 0; border-bottom: 1px solid #eaecef; }
#posts-list .post-title { font-weight: 600; }
#posts-list .post-meta { color: #666; font-size: 0.9em; margin-top: 0.125rem; }
#posts-list .post-excerpt { color: #444; margin-top: 0.25rem; }
#posts-list .chips { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }
#posts-list .chip { display: inline-block; padding: 0.1rem 0.4rem; border: 1px solid #ddd; border-radius: 999px; font-size: 0.8em; color: #555; background: #fafafa; }
.pagination { display: flex; gap: 0.25rem; flex-wrap: wrap; margin-top: 1rem; }
.pagination a, .pagination button { padding: 0.25rem 0.5rem; border: 1px solid #ddd; background: #fff; color: #0366d6; cursor: pointer; }
.pagination .active { background: #0366d6; color: #fff; border-color: #0366d6; }
.pagination .disabled { opacity: 0.5; pointer-events: none; }
.results-meta { color: #555; font-size: 0.9em; margin-bottom: 0.25rem; }
</style>


