/**
 * Build script: generates static, pre-rendered HTML for every blog post.
 * Run with: node build-blog-pages.js
 *
 * WHY THIS EXISTS
 * The old setup served every article from one file (insights/blog-details.html)
 * and injected the title, meta tags and body copy with JavaScript AFTER the page
 * loaded, keyed off a ?slug= query string. That means:
 *   - every article shared one URL pattern that only differed by a query string
 *     (search engines mostly treat those as one page, not three)
 *   - a crawler that reads raw HTML (without executing JS) saw an empty shell
 *   - the <title>/description/canonical in the raw HTML were generic, not
 *     per-article
 * This script bakes a real, unique, content-complete HTML file for each post
 * at a clean URL (/insights/<slug>.html), so the meta tags and full article
 * text are present on first byte, with no JavaScript required. blog-engine.js
 * still runs on top for interactivity (reading progress bar, tags, related
 * posts) but is no longer the only way the content ever reaches the page.
 */
const fs = require('fs');
const path = require('path');

global.window = {};
require('../assets/js/blogs-data.js');
const blogs = window.SMS_BLOGS;

const SITE = 'https://sms.abraca-dabra.com';

// Short, SERP-friendly <title> tags (kept separate from the longer on-page H1).
const SEO_TITLES = {
  'positive-safety-culture-digital-sms': 'Building a Positive Safety Culture with Digital SMS | SMS Safety',
  'near-miss-reporting-to-risk-reduction': 'Near-Miss Reporting: From Data to Risk Reduction | SMS Safety',
  'digitizing-incident-reporting-workplace-safety': 'How SMS Digitizes Incident Reporting for Industry | SMS Safety',
  'safety-observation-software-workplace-hazard-management': 'Safety Observation Software & Hazard CAPA Tracking | SMS Safety',
  'digital-safety-compliance-reporting-guide': 'Digital Safety Compliance & Auditable EHS Reporting | SMS Safety',
};

// Meta descriptions trimmed to ~150-160 chars where the source copy ran long.
const SEO_DESCRIPTIONS = {
  'positive-safety-culture-digital-sms': 'Learn how a digital Safety Management System helps organizations build a positive safety culture through faster reporting and transparent workflows.',
  'near-miss-reporting-to-risk-reduction': 'See how safety management software transforms near-miss reporting into proactive risk reduction, preventing workplace accidents before they happen.',
  'digitizing-incident-reporting-workplace-safety': 'See how AbracaDabra Safety Management System replaces paper safety registers with digital incident, accident and near-miss reporting for industrial teams.',
  'safety-observation-software-workplace-hazard-management': 'Empower shop-floor teams with safety observation software to capture unsafe conditions, implement CAPA workflows, and prevent workplace accidents proactively.',
  'digital-safety-compliance-reporting-guide': 'Streamline statutory safety reporting, ISO 45001 compliance, and EHS audits with an auditable digital safety management system. Export one-click dossiers.',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function initials(name) {
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

const BLOG_LINK_LABELS = {
  'positive-safety-culture-digital-sms': 'Read Safety Culture Guide',
  'near-miss-reporting-to-risk-reduction': 'Read Near-Miss Guide',
  'digitizing-incident-reporting-workplace-safety': 'Read Incident Reporting Guide',
  'safety-observation-software-workplace-hazard-management': 'Read Safety Observation Guide',
  'digital-safety-compliance-reporting-guide': 'Read Compliance Guide',
};

function relatedCardHtml(b) {
  const btnLabel = BLOG_LINK_LABELS[b.slug] || 'Read Full Guide';
  return `
              <article class="blog-card">
                <div class="card-img-wrap">
                  <span class="card-category-badge">${esc(b.category)}</span>
                  <img src="../${b.featuredImage}" alt="${esc(b.title)}" class="card-img" loading="lazy" width="1200" height="675" />
                </div>
                <div class="card-body">
                  <div class="blog-meta-top">
                    <span class="publish-date">${esc(b.publishDate)}</span>
                  </div>
                  <h3 class="card-title">
                    <a href="${b.slug}.html">${esc(b.title)}</a>
                  </h3>
                  <p class="card-excerpt">${esc(b.shortDescription)}</p>
                  ${b.tags ? `<div class="card-tags-row">${b.tags.slice(0, 3).map((t) => `<span class="mini-tag">#${esc(t)}</span>`).join('')}</div>` : ''}
                  <div class="card-footer">
                    <span class="author-name" style="font-size:0.82rem;color:var(--ink-55);">${esc(b.author)}</span>
                    <a href="${b.slug}.html" class="read-more-btn" aria-label="Read full article: ${esc(b.title)}">
                      ${btnLabel}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                  </div>
                </div>
              </article>`;
}

function navCardHtml(b, dir) {
  const label = dir === 'prev' ? 'Previous Article' : 'Next Article';
  const icon = dir === 'prev'
    ? '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'
    : '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>';
  return `
              <a href="${b.slug}.html" class="nav-card ${dir}">
                <span class="nav-card-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">${icon}</svg>
                  ${label}
                </span>
                <h4 class="nav-card-title">${esc(b.title)}</h4>
              </a>`;
}

function buildPage(blog, index) {
  const seoTitle = SEO_TITLES[blog.slug] || `${blog.title} | SMS Safety Insights`;
  const seoDesc = SEO_DESCRIPTIONS[blog.slug] || blog.shortDescription;
  const canonicalUrl = `${SITE}/insights/${blog.slug}.html`;
  const imageUrl = `${SITE}/${blog.featuredImage}`;

  const prevBlog = index > 0 ? blogs[index - 1] : blogs[blogs.length - 1];
  const nextBlog = index < blogs.length - 1 ? blogs[index + 1] : blogs[0];
  const related = blogs.filter((b) => b.slug !== blog.slug).slice(0, 3);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Insights', item: `${SITE}/#insights` },
      { '@type': 'ListItem', position: 3, name: blog.title, item: canonicalUrl },
    ],
  };

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: seoDesc,
    image: imageUrl,
    datePublished: blog.isoDate,
    dateModified: blog.isoDate,
    author: { '@type': 'Organization', name: blog.author },
    publisher: {
      '@type': 'Organization',
      name: 'AbracaDabra Software Solutions Pvt. Ltd.',
      logo: { '@type': 'ImageObject', url: `${SITE}/assets/img/logo.webp` },
    },
    mainEntityOfPage: canonicalUrl,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-G8Q8FL716B"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-G8Q8FL716B');
  </script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(seoTitle)}</title>
  <meta name="description" content="${esc(seoDesc)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#0B1E33" />
  <meta name="author" content="AbracaDabra Software Solutions Pvt. Ltd." />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="SMS Safety Management System" />
  <meta property="og:title" content="${esc(seoTitle)}" />
  <meta property="og:description" content="${esc(seoDesc)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_IN" />
  <meta property="article:published_time" content="${blog.isoDate}" />
  <meta property="article:modified_time" content="${blog.isoDate}" />
  <meta property="article:section" content="${esc(blog.category)}" />
  ${(blog.tags || []).map((t) => `<meta property="article:tag" content="${esc(t)}" />`).join('\n  ')}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(seoTitle)}" />
  <meta name="twitter:description" content="${esc(seoDesc)}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- Icons -->
  <link rel="icon" href="../assets/img/logo.webp" type="image/webp" />
  <link rel="icon" href="../assets/img/logo.webp" sizes="32x32" type="image/webp" />
  <link rel="icon" href="../assets/img/favicon-192.webp" sizes="192x192" type="image/webp" />
  <link rel="apple-touch-icon" href="../assets/img/favicon-192.webp" />
  <link rel="manifest" href="../site.webmanifest" />

  <!-- Fonts & Styles -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" /></noscript>
  <link rel="stylesheet" href="../assets/css/style.min.css" />
  <link rel="stylesheet" href="../assets/css/blog.min.css" />

  <script type="application/ld+json">${JSON.stringify(articleLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
</head>
<body>
  <!-- Reading Progress Bar -->
  <div class="reading-progress-container">
    <div class="reading-progress-bar" id="reading-progress-bar"></div>
  </div>

  <a class="skip-link" href="#main">Skip to main content</a>

  <!-- SITE HEADER -->
  <header class="site-header">
    <div class="container-wide">
      <div class="nav-row">
        <a href="../index.html" class="brand" aria-label="SMS Safety Management System home">
          <img src="../assets/img/logo.webp" width="53" height="53" alt="SMS Logo" class="brand-logo" />
          <span class="brand-text"><strong>SMS</strong><span>SAFETY MANAGEMENT SYSTEM</span></span>
        </a>
        <nav class="nav-links" aria-label="Primary">
          <a href="../index.html#product">Product</a>
          <a href="../index.html#features">Features</a>
          <a href="../index.html#platforms">Platforms</a>
          <a href="../index.html#workflow">Workflow</a>
          <a href="../index.html#gallery">Gallery &amp; Video</a>
          <a href="../index.html#insights" aria-current="page">Insights</a>
          <a href="../index.html#faq">FAQ</a>
          <div class="mobile-nav-cta">
            <a href="../index.html#contact" class="btn btn-amber btn-block">Request Demo</a>
          </div>
        </nav>
        <div class="nav-cta">
          <a href="../index.html#contact" class="btn btn-amber">Request Demo</a>
          <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="nav-toggle-icon" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" class="line-top"></line>
              <line x1="4" y1="12" x2="20" y2="12" class="line-mid"></line>
              <line x1="4" y1="18" x2="20" y2="18" class="line-bot"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="nav-overlay" id="nav-overlay" aria-hidden="true"></div>
  </header>

  <!-- BREADCRUMB BAR -->
  <div class="breadcrumb-bar">
    <div class="container-wide">
      <ol>
        <li><a href="../index.html">Home</a></li>
        <li><a href="../index.html#insights">Insights</a></li>
        <li aria-current="page" id="breadcrumb-current-title">${esc(blog.title)}</li>
      </ol>
    </div>
  </div>

  <main id="main">
    <div id="blog-detail-view">
      <!-- ARTICLE HEADER -->
      <section class="article-header">
        <div class="container">
          <div class="article-header-container">
            <span id="article-category" class="category-tag">${esc(blog.category)}</span>
            <h1 id="article-title" class="article-title">${esc(blog.title)}</h1>
            <div class="article-meta-large">
              <div class="author-info">
                <div id="article-author-avatar" class="author-avatar">${esc(initials(blog.author))}</div>
                <div class="author-details">
                  <span id="article-author-name" class="author-name">${esc(blog.author)}</span>
                  <span id="article-author-role" class="publish-date">${esc(blog.authorRole || 'SMS EHS Specialist')}</span>
                </div>
              </div>
              <div class="read-time" style="margin-left:auto;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span id="article-publish-date">${esc(blog.publishDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ARTICLE HERO MEDIA -->
      <div class="container">
        <div class="article-hero-media">
          <img id="article-hero-img" src="../${blog.featuredImage}" alt="${esc(blog.title)}" width="1672" height="941" />
        </div>
      </div>

      <!-- ARTICLE CONTENT BODY -->
      <div class="container">
        <div class="article-wrapper">
          <article id="article-content-body" class="article-body">
${blog.fullContent.replace(/\.\.\/index\.html/g, '../index.html')}
          </article>

          <!-- TAGS & BACK BUTTON -->
          <div class="article-tags-bar">
            <span class="tags-label">Article Tags:</span>
            <div id="article-tags-container">${(blog.tags || []).map((t) => `<span class="article-tag-chip">#${esc(t)}</span>`).join('')}</div>
          </div>

          <div style="margin-top:24px;">
            <a href="../index.html#insights" class="btn btn-ghost-dark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span>Back to Safety Insights</span>
            </a>
          </div>
        </div>

        <!-- PREVIOUS / NEXT NAVIGATION -->
        <div class="article-wrapper">
          <div class="post-navigation-grid" id="post-navigation-container">${navCardHtml(prevBlog, 'prev')}${navCardHtml(nextBlog, 'next')}
          </div>
        </div>
      </div>

      <!-- RELATED ARTICLES SECTION -->
      <section class="related-posts-section">
        <div class="container">
          <div class="section-title-row">
            <h2>Related Safety Insights</h2>
            <a href="../index.html#insights" class="read-more-btn">View All Insights &rarr;</a>
          </div>
          <div class="all-blogs-grid" id="related-blogs-grid">${related.map(relatedCardHtml).join('')}
          </div>
        </div>
      </section>
    </div>
  </main>

  <!-- FOOTER -->
  <footer class="site-footer">
    <div class="container-wide">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="../index.html" class="brand" aria-label="SMS Safety Management System home">
            <img src="../assets/img/logo.webp" width="53" height="53" alt="SMS Logo" class="brand-logo" />
            <span class="brand-text"><strong>SMS</strong><span>SAFETY MANAGEMENT SYSTEM</span></span>
          </a>
          <p>Safety observation, accident and near-miss reporting on one auditable platform &mdash; web, Android and iOS. Built and supported by AbracaDabra Software Solutions Pvt. Ltd.</p>
          <div class="social-row">
            <a href="https://www.facebook.com/AbracaDabraSoftwareSolutions/" aria-label="SMS Safety Management System on Facebook" rel="noopener" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
            <a href="https://www.linkedin.com/company/abracadabra-software-solutions-pvt-ltd/" aria-label="SMS Safety Management System on LinkedIn" rel="noopener" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
            <a href="https://www.youtube.com/@abracadabrasoftwaresolutions" aria-label="SMS Safety Management System on YouTube" rel="noopener" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></a>
            <a href="https://wa.me/919822545211" aria-label="Chat with SMS Safety Management System on WhatsApp" rel="noopener" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><a href="../index.html#product">Overview</a></li>
            <li><a href="../index.html#features">Features</a></li>
            <li><a href="../index.html#platforms">Platforms</a></li>
            <li><a href="../index.html#workflow">Workflow</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="../index.html#portfolio">Portfolio</a></li>
            <li><a href="../index.html#gallery">Gallery</a></li>
            <li><a href="https://www.abraca-dabra.com/" rel="noopener" target="_blank">Official Website</a></li>
            <li><a href="https://kaizenmanagementsystem.in/" rel="noopener" target="_blank">Kaizen Management System (KMS) &#8599;</a></li>
            <li><a href="../index.html#faq">FAQ</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Resources</h4>
          <ul>
            <li><a href="../index.html#insights">Insights &amp; Blog</a></li>
            <li><a href="../index.html#contact">Contact</a></li>
            <li><a href="../index.html#contact">Request a demo</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Get the app</h4>
          <ul>
            <li><a href="https://play.google.com/store/apps/details?id=com.Abracadabra.SAFETY" rel="noopener" target="_blank">Google Play</a></li>
            <li><span>App Store &mdash; coming soon</span></li>
            <li><a href="../index.html#platforms">Web portal login</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; <span id="year">2026</span> SMS Safety Management System. All rights reserved. Powered by <a href="https://www.abraca-dabra.com/" rel="noopener" target="_blank">AbracaDabra Software Solutions Pvt. Ltd.</a></span>
      </div>
    </div>
  </footer>

  <!-- SCRIPTS -->
  <script src="../assets/js/main.min.js" defer></script>
  <script src="../assets/js/sms-contact-sheet.min.js" defer></script>
  <script src="../assets/js/sms-chatbot.min.js" defer></script>
  <script src="../assets/js/blogs-data.js" defer></script>
  <script src="../assets/js/blog-engine.js" defer></script>

  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
`;
}

const outDir = path.join(__dirname, '..', 'insights');
blogs.forEach((blog, i) => {
  const html = buildPage(blog, i);
  const outPath = path.join(outDir, `${blog.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log('wrote', outPath);
});
