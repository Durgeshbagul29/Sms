# Sms - Safety Management System (SafeGuard SMS)

[![Production](https://img.shields.io/badge/Production-sms.abraca--dabra.com-0B1E33)](https://sms.abraca-dabra.com/)
[![Built By](https://img.shields.io/badge/Built%20By-AbracaDabra%20Software%20Solutions-F0A202)](https://www.abraca-dabra.com/)
[![SEO](https://img.shields.io/badge/SEO-100-success)](https://sms.abraca-dabra.com/)
[![Best Practices](https://img.shields.io/badge/Best%20Practices-100-success)](https://sms.abraca-dabra.com/)

SafeGuard SMS is an enterprise-grade Safety Management System designed to empower modern industrial, automotive, and manufacturing workplaces with digital incident reporting, accident tracking, near-miss logging, safety observation (UA/UC) workflows, and auditable EHS compliance dossiers.

---

## Key Features

- **Incident & Accident Management:** Instant shop-floor incident logging, 5-Why root cause analysis, severity assessment, and CAPA resolution tracking.
- **Near Miss Reporting:** Anonymous and attributed near-miss reporting with proactive Heinrich triangle risk reduction.
- **Safety Observations (UA/UC):** Capture unsafe acts and unsafe conditions on mobile or web with real-time photo evidence.
- **Ethics & Grievance Reporting:** Confidential reporting channel for workplace ethics and safety protocol breaches.
- **Multi-Platform Access:** Cross-platform web portal with dedicated Android and iOS native mobile applications.
- **Live Safety Analytics & Export:** Real-time safety KPIs, severity heatmaps, department breakdown charts, and one-click exportable PDF/Excel compliance reports.

---

## Technical Architecture & Performance

- **Frontend:** Semantic HTML5, Vanilla CSS design system, modular Vanilla JavaScript.
- **Core Web Vitals Optimized:** Zero layout thrashing, debounced scroll measurements, and sub-second critical path rendering.
- **Responsive Media:** High-fidelity WebP imagery with multi-density `srcset` (1x/2x logo and responsive article thumbnails).
- **SEO & Structured Data:** Semantic heading hierarchy, JSON-LD schemas (`Organization`, `WebSite`, `SoftwareApplication`, `BreadcrumbList`, `Article`, `FAQPage`), dynamic sitemap, and Googlebot-friendly robots.txt.
- **Accessibility:** Full WCAG 2.1 AA compliance (>= 4.5:1 text contrast ratios, WAI-ARIA tablist roles, and keyboard navigation).

---

## Project Structure

```text
├── .gitignore                   # Ignored dependencies, OS files, and logs
├── .htaccess                    # Apache/LiteSpeed caching, compression & security headers
├── 404.html                     # Custom accessible 404 error page
├── index.html                   # High-converting commercial homepage
├── site.webmanifest             # Progressive Web App manifest
├── sitemap.xml                  # Canonical XML sitemap for search engines
├── robots.txt                   # Search crawler directives
├── assets/
│   ├── css/
│   │   ├── style.css            # Core design system tokens and responsive styles
│   │   ├── blog.css             # Article layout styling
│   │   └── sms-chatbot.css      # Embedded AI assistant widget styling
│   ├── js/
│   │   ├── main.js              # ScrollSpy, navbar, mobile slider & modal handlers
│   │   ├── blogs-data.js        # Safety insight articles repository
│   │   ├── blog-engine.js       # Dynamic article renderer with responsive thumbnails
│   │   └── sms-chatbot.js       # Interactive FAQ chatbot logic
│   └── img/                     # Optimized WebP assets, screenshots, and logos
├── insights/                    # Statically generated canonical SEO article pages
└── scripts/
    └── build-blog-pages.js      # Static site generation script for /insights/
```

---

## Local Development & Static Generation

To rebuild static insight pages:
```bash
node scripts/build-blog-pages.js
```

To run locally with any static HTTP server:
```bash
# Using Node.js
npx serve .

# Or using Python
python -m http.server 8080
```

---

## Production Deployment

Deployed at: **[https://sms.abraca-dabra.com/](https://sms.abraca-dabra.com/)**  
Built and supported by **AbracaDabra Software Solutions Pvt. Ltd.** (Nashik, Maharashtra, India).
