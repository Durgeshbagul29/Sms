/**
 * SMS Safety Management System — Dynamic Blog & SEO Engine
 * Handles dynamic rendering, search filtering, category filtering,
 * reading progress, prev/next article navigation, and dynamic SEO metadata.
 */

document.addEventListener('DOMContentLoaded', () => {
  const blogs = window.SMS_BLOGS || [];
  const isInsideInsightsFolder = window.location.pathname.includes('/insights/');

  // Standardize asset and link paths based on current page depth
  const getAssetPath = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^(\.\.\/)+/, '').replace(/^assets\//, '');
    return isInsideInsightsFolder ? `../assets/${cleanPath}` : `assets/${cleanPath}`;
  };

  // Clean, crawlable article URLs: /insights/<slug>.html (no query string).
  const getDetailUrl = (slug) => {
    return isInsideInsightsFolder ? `${slug}.html` : `insights/${slug}.html`;
  };

  const getHubUrl = () => {
    return isInsideInsightsFolder ? '../index.html#insights' : '#insights';
  };

  // Resolve the current article's slug. Static pages are named <slug>.html,
  // so the filename itself is the primary source of truth. The old
  // ?slug=... query string is still honored for backward compatibility with
  // any previously indexed or bookmarked links.
  const getSlugFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const queryStringSlug = params.get('slug');
    if (queryStringSlug) return queryStringSlug;

    const fileMatch = window.location.pathname.match(/\/([^/]+)\.html$/);
    if (fileMatch && fileMatch[1] && fileMatch[1] !== 'blog-details' && fileMatch[1] !== 'index') {
      return fileMatch[1];
    }
    return null;
  };

  /* =========================================================================
     1. BLOG DETAILS PAGE ENGINE
     ========================================================================= */
  const initBlogDetailsPage = () => {
    const detailContainer = document.getElementById('blog-detail-view');
    if (!detailContainer) return;

    const slug = getSlugFromUrl();
    const blog = blogs.find(b => b.slug === slug) || blogs[0]; // fallback to first blog if slug missing or invalid

    if (!blog) {
      detailContainer.innerHTML = `
        <div class="container section-pad">
          <div class="no-blogs-found">
            <svg class="no-blogs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <h3>Article Not Found</h3>
            <p>The safety insight article you are looking for might have been moved or updated.</p>
            <a href="${getHubUrl()}" class="btn btn-amber">Back to Safety Insights</a>
          </div>
        </div>
      `;
      return;
    }

    // 1. Update Dynamic SEO & Meta Tags
    updateSeoMetadata(blog);

    // 2. Render Reading Progress Bar Listener
    initReadingProgressBar();

    // 3. Render Breadcrumbs
    const breadcrumbTitle = document.getElementById('breadcrumb-current-title');
    if (breadcrumbTitle) {
      breadcrumbTitle.textContent = blog.title;
    }

    // 4. Render Article Header
    const categoryBadge = document.getElementById('article-category');
    if (categoryBadge) categoryBadge.textContent = blog.category;

    const titleEl = document.getElementById('article-title');
    if (titleEl) titleEl.textContent = blog.title;

    const authorNameEl = document.getElementById('article-author-name');
    if (authorNameEl) authorNameEl.textContent = blog.author;

    const authorRoleEl = document.getElementById('article-author-role');
    if (authorRoleEl) authorRoleEl.textContent = blog.authorRole || 'SMS EHS Specialist';

    const publishDateEl = document.getElementById('article-publish-date');
    if (publishDateEl) publishDateEl.textContent = blog.publishDate;

    const authorAvatarEl = document.getElementById('article-author-avatar');
    if (authorAvatarEl) {
      authorAvatarEl.textContent = blog.author.split(' ').map(n => n[0]).join('').substring(0, 2);
    }

    // 5. Render Hero Image with Preloading & Smooth Fade-in
    const heroImg = document.getElementById('article-hero-img');
    const targetImgSrc = getAssetPath(blog.featuredImage);

    const hideLoaderAndShowContent = () => {
      if (heroImg) {
        heroImg.src = targetImgSrc;
        heroImg.alt = blog.title;
        heroImg.style.opacity = '1';
      }
      const loader = document.getElementById('blog-page-loader');
      if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 350);
      }
    };

    if (heroImg) {
      const imgPreloader = new Image();
      imgPreloader.onload = hideLoaderAndShowContent;
      imgPreloader.onerror = hideLoaderAndShowContent;
      imgPreloader.src = targetImgSrc;

      if (imgPreloader.complete) {
        hideLoaderAndShowContent();
      }
    } else {
      hideLoaderAndShowContent();
    }

    // 6. Render Full Content Body
    const contentEl = document.getElementById('article-content-body');
    if (contentEl) {
      contentEl.innerHTML = blog.fullContent;
    }

    // 7. Render Tags Bar
    const tagsContainer = document.getElementById('article-tags-container');
    if (tagsContainer && blog.tags) {
      tagsContainer.innerHTML = blog.tags.map(t => `<span class="article-tag-chip">#${t}</span>`).join('');
    }

    // 8. Render Prev / Next Article Links
    renderPrevNextNavigation(blog);

    // 9. Render Related Articles Grid
    renderRelatedBlogs(blog);
  };

  // SEO Update Helper
  const updateSeoMetadata = (blog) => {
    const fullTitle = `${blog.title} | SMS Safety Insights`;
    document.title = fullTitle;

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = blog.shortDescription;

    // Canonical URL (clean, query-string-free article URL)
    const canonicalUrl = `https://sms.abraca-dabra.com/insights/${blog.slug}.html`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Open Graph
    setMetaProperty('og:title', fullTitle);
    setMetaProperty('og:description', blog.shortDescription);
    setMetaProperty('og:url', canonicalUrl);
    setMetaProperty('og:image', `https://sms.abraca-dabra.com/${blog.featuredImage}`);

    // Twitter Card
    setMetaName('twitter:title', fullTitle);
    setMetaName('twitter:description', blog.shortDescription);
    setMetaName('twitter:image', `https://sms.abraca-dabra.com/${blog.featuredImage}`);

    // Dynamic Article JSON-LD Schema
    let jsonLdScript = document.getElementById('dynamic-jsonld-schema');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'dynamic-jsonld-schema';
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }

    const jsonLdData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blog.title,
      "description": blog.shortDescription,
      "image": `https://sms.abraca-dabra.com/${blog.featuredImage}`,
      "datePublished": blog.isoDate,
      "dateModified": blog.isoDate,
      "author": {
        "@type": "Organization",
        "name": blog.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "AbracaDabra Software Solutions Pvt. Ltd.",
        "logo": {
          "@type": "ImageObject",
          "url": "https://sms.abraca-dabra.com/assets/img/logo.webp"
        }
      },
      "mainEntityOfPage": canonicalUrl
    };

    jsonLdScript.textContent = JSON.stringify(jsonLdData);
  };

  const setMetaProperty = (prop, content) => {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  const setMetaName = (name, content) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      document.head.appendChild(el);
    }
    el.content = content;
  };

  const initReadingProgressBar = () => {
    const progressBar = document.getElementById('reading-progress-bar');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    });
  };

  const renderPrevNextNavigation = (currentBlog) => {
    const container = document.getElementById('post-navigation-container');
    if (!container) return;

    const currentIndex = blogs.findIndex(b => b.slug === currentBlog.slug);
    const prevBlog = currentIndex > 0 ? blogs[currentIndex - 1] : blogs[blogs.length - 1];
    const nextBlog = currentIndex < blogs.length - 1 ? blogs[currentIndex + 1] : blogs[0];

    container.innerHTML = `
      <a href="${getDetailUrl(prevBlog.slug)}" class="nav-card prev">
        <span class="nav-card-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Previous Article
        </span>
        <h4 class="nav-card-title">${prevBlog.title}</h4>
      </a>
      <a href="${getDetailUrl(nextBlog.slug)}" class="nav-card next">
        <span class="nav-card-label">
          Next Article
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
        <h4 class="nav-card-title">${nextBlog.title}</h4>
      </a>
    `;
  };

  const renderRelatedBlogs = (currentBlog) => {
    const relatedContainer = document.getElementById('related-blogs-grid');
    if (!relatedContainer) return;

    const related = blogs.filter(b => b.slug !== currentBlog.slug).slice(0, 2);
    relatedContainer.innerHTML = related.map(b => createBlogCardHtml(b)).join('');
  };


  /* =========================================================================
     2. BLOG HUB LISTING PAGE ENGINE
     ========================================================================= */
  let currentCategory = 'All';
  let currentSearchQuery = '';

  const initBlogListingPage = () => {
    const listingContainer = document.getElementById('all-blogs-container');
    if (!listingContainer) return;

    // Render Category Pills
    renderCategoryPills();

    // Attach Search Listener
    const searchInput = document.getElementById('blog-search-input');
    const searchClearBtn = document.getElementById('blog-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        if (searchClearBtn) {
          searchClearBtn.style.display = currentSearchQuery.length > 0 ? 'flex' : 'none';
        }
        applyFilters();
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentSearchQuery = '';
        searchClearBtn.style.display = 'none';
        applyFilters();
      });
    }

    // Initial render
    applyFilters();
  };

  const renderCategoryPills = () => {
    const wrapper = document.getElementById('blog-categories-wrapper');
    if (!wrapper) return;

    // Extract unique categories
    const categories = ['All', ...new Set(blogs.map(b => b.category))];

    wrapper.innerHTML = categories.map(cat => {
      const count = cat === 'All' ? blogs.length : blogs.filter(b => b.category === cat).length;
      const isActive = cat === currentCategory ? 'active' : '';
      return `
        <button type="button" class="cat-pill ${isActive}" data-category="${cat}">
          ${cat} <span class="pill-count">${count}</span>
        </button>
      `;
    }).join('');

    wrapper.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category');
        applyFilters();
      });
    });
  };

  const applyFilters = () => {
    const featuredContainer = document.getElementById('featured-blog-container');
    const gridContainer = document.getElementById('all-blogs-container');
    const noResultsContainer = document.getElementById('no-blogs-found');

    // Filter matching blogs
    const filtered = blogs.filter(b => {
      const matchesCat = currentCategory === 'All' || b.category === currentCategory;
      const matchesSearch = !currentSearchQuery || (
        b.title.toLowerCase().includes(currentSearchQuery) ||
        b.shortDescription.toLowerCase().includes(currentSearchQuery) ||
        b.category.toLowerCase().includes(currentSearchQuery) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(currentSearchQuery)))
      );
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      if (featuredContainer) featuredContainer.style.display = 'none';
      if (gridContainer) gridContainer.style.display = 'none';
      if (noResultsContainer) {
        noResultsContainer.style.display = 'block';
        noResultsContainer.innerHTML = `
          <svg class="no-blogs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          <h3>No safety articles found</h3>
          <p>We couldn't find any articles matching "<strong>${escapeHtml(currentSearchQuery)}</strong>". Try checking for spelling errors or searching another topic.</p>
          <button type="button" class="btn btn-amber" id="reset-filters-btn">Clear All Filters</button>
        `;

        document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
          currentCategory = 'All';
          currentSearchQuery = '';
          const searchInput = document.getElementById('blog-search-input');
          if (searchInput) searchInput.value = '';
          const searchClearBtn = document.getElementById('blog-search-clear');
          if (searchClearBtn) searchClearBtn.style.display = 'none';
          renderCategoryPills();
          applyFilters();
        });
      }
      return;
    }

    if (noResultsContainer) noResultsContainer.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'grid';

    // Featured Blog Logic:
    // If no search filter active, show the designated featured blog at top and remaining in grid.
    // If search filter active, render all matching blogs in grid.
    const isDefaultView = currentCategory === 'All' && !currentSearchQuery;

    if (isDefaultView && featuredContainer) {
      featuredContainer.style.display = 'block';
      const featuredBlog = blogs.find(b => b.featured) || blogs[0];
      featuredContainer.innerHTML = renderFeaturedBlogHtml(featuredBlog);

      const gridBlogs = blogs.filter(b => b.id !== featuredBlog.id);
      gridContainer.innerHTML = gridBlogs.map(b => createBlogCardHtml(b)).join('');
    } else {
      if (featuredContainer) featuredContainer.style.display = 'none';
      gridContainer.innerHTML = filtered.map(b => createBlogCardHtml(b)).join('');
    }
  };

  // Helper HTML Generators
  const renderFeaturedBlogHtml = (blog) => {
    return `
      <div class="featured-blog-card">
        <div class="featured-img-wrap">
          <span class="featured-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Featured Insight
          </span>
          <img src="${getAssetPath(blog.featuredImage)}" alt="${blog.title}" class="featured-img" loading="eager" />
        </div>
        <div class="featured-content">
          <div class="blog-meta-top">
            <span class="category-tag">${blog.category}</span>
          </div>
          <h3 class="featured-title">
            <a href="${getDetailUrl(blog.slug)}">${blog.title}</a>
          </h3>
          <p class="featured-excerpt">${blog.shortDescription}</p>
          <div class="featured-footer">
            <div class="author-info">
              <div class="author-avatar">${blog.author.substring(0, 2).toUpperCase()}</div>
              <div class="author-details">
                <span class="author-name">${blog.author}</span>
                <span class="publish-date">${blog.publishDate}</span>
              </div>
            </div>
            <a href="${getDetailUrl(blog.slug)}" class="btn btn-amber">
              <span>Read Article</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  };

  const getThumbPath = (path) => {
    if (!path) return '';
    const thumb = path.replace('.webp', '-thumb.webp');
    return getAssetPath(thumb);
  };

  const createBlogCardHtml = (blog) => {
    return `
      <article class="blog-card">
        <div class="card-img-wrap">
          <span class="card-category-badge">${blog.category}</span>
          <img src="${getThumbPath(blog.featuredImage)}" srcset="${getAssetPath(blog.featuredImage)} 1672w, ${getThumbPath(blog.featuredImage)} 800w" sizes="(max-width: 768px) 100vw, 380px" alt="${escapeHtml(blog.title)}" class="card-img" loading="lazy" width="800" height="450" />
        </div>
        <div class="card-body">
          <div class="blog-meta-top">
            <span class="publish-date">${blog.publishDate}</span>
          </div>
          <h3 class="card-title">
            <a href="${getDetailUrl(blog.slug)}">${blog.title}</a>
          </h3>
          <p class="card-excerpt">${blog.shortDescription}</p>
          ${blog.tags ? `
            <div class="card-tags-row">
              ${blog.tags.slice(0, 3).map(t => `<span class="mini-tag">#${t}</span>`).join('')}
            </div>
          ` : ''}
          <div class="card-footer">
            <span class="author-name" style="font-size:0.82rem;color:var(--ink-55);">${blog.author}</span>
            <a href="${getDetailUrl(blog.slug)}" class="read-more-btn" aria-label="Read full article: ${escapeHtml(blog.title)}">
              Read Guide
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </div>
      </article>
    `;
  };

  const escapeHtml = (str) => {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  // Initialize Pages
  initBlogListingPage();
  initBlogDetailsPage();

  /* =========================================================================
     3. HOMEPAGE BLOGS GRID ENGINE
     ========================================================================= */
  const initHomepageBlogs = () => {
    const homepageGrid = document.getElementById('homepage-blogs-grid');
    if (!homepageGrid) return;
    homepageGrid.innerHTML = blogs.map(b => createBlogCardHtml(b)).join('');
  };
  initHomepageBlogs();
});
