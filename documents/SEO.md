# SEO Optimization Guide

Hướng dẫn kiểm tra và tối ưu SEO cho các dự án web, đặc biệt là React SPA applications.

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Checklist SEO cơ bản](#checklist-seo-cơ-bản)
3. [Meta Tags](#meta-tags)
4. [Structured Data (JSON-LD)](#structured-data-json-ld)
5. [Technical SEO](#technical-seo)
6. [Performance & Core Web Vitals](#performance--core-web-vitals)
7. [Accessibility](#accessibility)
8. [Implementation Guide](#implementation-guide)
9. [Testing & Validation](#testing--validation)

---

## Tổng quan

SEO (Search Engine Optimization) là quá trình tối ưu hóa website để cải thiện thứ hạng trên các công cụ tìm kiếm. Đối với React SPA, cần đặc biệt chú ý đến:

- **Meta Tags**: Title, description, Open Graph, Twitter Cards
- **Structured Data**: JSON-LD schemas
- **Technical SEO**: robots.txt, sitemap.xml, canonical URLs
- **Performance**: Core Web Vitals, lazy loading, code splitting
- **Accessibility**: Semantic HTML, ARIA labels

---

## Checklist SEO cơ bản

### ✅ Meta Tags

- [ ] **Title Tag**: Unique, descriptive, 50-60 characters
- [ ] **Meta Description**: Compelling, 150-160 characters
- [ ] **Meta Keywords**: (Optional, not as important as before)
- [ ] **Open Graph Tags**: og:title, og:description, og:image, og:url, og:type
- [ ] **Twitter Card Tags**: twitter:card, twitter:title, twitter:description, twitter:image
- [ ] **Canonical URL**: Prevent duplicate content
- [ ] **Robots Meta**: Control indexing (index/noindex, follow/nofollow)

### ✅ Structured Data

- [ ] **Organization Schema**: Company/website information
- [ ] **BreadcrumbList Schema**: Navigation structure
- [ ] **WebApplication Schema**: If applicable
- [ ] **Article Schema**: For blog posts/articles
- [ ] **Product Schema**: For e-commerce
- [ ] **Custom Schemas**: Based on content type

### ✅ Technical SEO

- [ ] **robots.txt**: Properly configured
- [ ] **sitemap.xml**: Generated and submitted
- [ ] **HTTPS**: SSL certificate installed
- [ ] **Mobile Responsive**: Viewport meta tag
- [ ] **Language Tags**: HTML lang attribute
- [ ] **Favicon**: Multiple sizes (16x16, 32x32, 192x192, 512x512)

### ✅ Performance

- [ ] **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] **Code Splitting**: Lazy load routes
- [ ] **Image Optimization**: WebP format, lazy loading, proper sizes
- [ ] **Font Loading**: Preload critical fonts
- [ ] **Resource Hints**: preconnect, dns-prefetch

### ✅ Accessibility

- [ ] **Semantic HTML**: header, nav, main, article, section, footer
- [ ] **Heading Hierarchy**: Proper h1-h6 structure
- [ ] **ARIA Labels**: For interactive elements
- [ ] **Alt Text**: All images have descriptive alt attributes
- [ ] **Keyboard Navigation**: All interactive elements accessible
- [ ] **Color Contrast**: WCAG AA compliance

---

## Meta Tags

### Basic Meta Tags

```html
<!-- Primary Meta Tags -->
<title>Page Title | Site Name</title>
<meta name="description" content="Page description (150-160 characters)" />
<meta name="keywords" content="keyword1, keyword2, keyword3" />
<meta name="author" content="Author Name" />
<link rel="canonical" href="https://example.com/page" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="Page description" />
<meta property="og:image" content="https://example.com/og-image.jpg" />
<meta property="og:site_name" content="Site Name" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://example.com/page" />
<meta name="twitter:title" content="Page Title" />
<meta name="twitter:description" content="Page description" />
<meta name="twitter:image" content="https://example.com/twitter-image.jpg" />
```

### React Implementation (react-helmet-async)

```tsx
import { Helmet } from 'react-helmet-async';

function SEO({ title, description, image, url }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
```

---

## Structured Data (JSON-LD)

### Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}
```

### BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Page",
      "item": "https://example.com/page"
    }
  ]
}
```

### React Implementation

```tsx
import { Helmet } from 'react-helmet-async';

function StructuredData({ data }) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
}
```

---

## Technical SEO

### robots.txt

```
User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### HTML Lang Attribute

```html
<html lang="en">
<!-- or -->
<html lang="vi">
```

---

## Performance & Core Web Vitals

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100 milliseconds
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimization Techniques

1. **Code Splitting**
   ```tsx
   const Component = lazy(() => import('./Component'));
   ```

2. **Image Optimization**
   ```tsx
   <img 
     src="image.webp" 
     alt="Description"
     loading="lazy"
     decoding="async"
   />
   ```

3. **Resource Hints**
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="dns-prefetch" href="https://api.example.com" />
   ```

4. **Font Loading**
   ```html
   <link rel="preload" href="/fonts/font.woff2" as="font" type="font/woff2" crossorigin />
   ```

---

## Accessibility

### Semantic HTML

```html
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h1>Article Title</h1>
    <section>
      <h2>Section Title</h2>
    </section>
  </article>
</main>
<footer>Footer content</footer>
```

### ARIA Labels

```tsx
<button aria-label="Close dialog">×</button>
<input aria-label="Search" aria-describedby="search-help" />
<div role="alert" aria-live="polite">Error message</div>
```

### Alt Text

```tsx
<img 
  src="image.jpg" 
  alt="Descriptive text explaining what the image shows"
/>
```

---

## Implementation Guide

### Step 1: Install Dependencies

```bash
npm install react-helmet-async
```

### Step 2: Setup HelmetProvider

```tsx
// App.tsx
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      {/* Your app */}
    </HelmetProvider>
  );
}
```

### Step 3: Create SEO Component

```tsx
// components/SEO.tsx
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  noindex?: boolean;
}

export default function SEO({ title, description, image, url, noindex }: SEOProps) {
  const fullTitle = title ? `${title} | Site Name` : 'Site Name';
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />
      {/* Open Graph and Twitter tags */}
    </Helmet>
  );
}
```

### Step 4: Use in Pages

```tsx
// pages/HomePage.tsx
import SEO from '../components/SEO';

export default function HomePage() {
  return (
    <>
      <SEO 
        title="Home"
        description="Welcome to our website"
        url="https://example.com"
      />
      <main>
        {/* Page content */}
      </main>
    </>
  );
}
```

### Step 5: Create robots.txt and sitemap.xml

Place in `public/` folder:
- `public/robots.txt`
- `public/sitemap.xml`

---

## Testing & Validation

### Tools for Testing

1. **Google Search Console**: Submit sitemap, check indexing
2. **Google Rich Results Test**: Validate structured data
   - https://search.google.com/test/rich-results
3. **PageSpeed Insights**: Check Core Web Vitals
   - https://pagespeed.web.dev/
4. **Lighthouse**: Comprehensive audit
   - Chrome DevTools > Lighthouse
5. **WAVE**: Accessibility testing
   - https://wave.webaim.org/
6. **Schema Markup Validator**: Validate JSON-LD
   - https://validator.schema.org/

### Checklist Before Launch

- [ ] All pages have unique titles and descriptions
- [ ] Open Graph images are properly sized (1200x630px recommended)
- [ ] Structured data validates without errors
- [ ] robots.txt is accessible at `/robots.txt`
- [ ] sitemap.xml is accessible at `/sitemap.xml`
- [ ] All images have alt text
- [ ] Core Web Vitals meet targets
- [ ] Site is mobile responsive
- [ ] HTTPS is enabled
- [ ] Canonical URLs are set correctly

---

## Special Considerations for SPA

### React Router & SEO

For Single Page Applications (SPA):

1. **Server-Side Rendering (SSR)**: Consider Next.js or Remix for better SEO
2. **Pre-rendering**: Use tools like Prerender.io or react-snap
3. **Dynamic Meta Tags**: Use react-helmet-async for route-based meta tags
4. **Hash vs Browser Router**: Use BrowserRouter (not HashRouter) for clean URLs

### Internal Applications

For internal applications requiring authentication:

- Set `noindex, nofollow` on all pages
- Disallow all crawlers in robots.txt
- Still implement SEO best practices for:
  - Social sharing (Open Graph)
  - Internal search
  - Future public pages

---

## Environment Variables

Create `.env` file:

```env
VITE_SITE_URL=https://example.com
VITE_SITE_NAME=Site Name
VITE_SITE_DESCRIPTION=Default site description
```

Use in code:

```tsx
const siteUrl = import.meta.env.VITE_SITE_URL || 'https://example.com';
```

---

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Web.dev SEO Guide](https://web.dev/learn/seo/)
- [MDN Web Docs - SEO](https://developer.mozilla.org/en-US/docs/Glossary/SEO)

---

## Notes

- SEO is an ongoing process, not a one-time setup
- Monitor Search Console regularly
- Update sitemap when adding new pages
- Keep meta descriptions fresh and relevant
- Test changes in staging before production
- Consider hiring SEO specialist for complex projects

---

**Last Updated**: 2024-01-01
**Version**: 1.0
