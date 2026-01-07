import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const defaultTitle = 'FurniCare - Warranty Management System';
const defaultDescription = 'Comprehensive warranty management system for furniture care and maintenance tracking';
const defaultImage = '/og-image.png';
const siteUrl = import.meta.env.VITE_SITE_URL || 'https://furnicare.example.com';
const siteName = 'FurniCare';

export default function SEO({
  title,
  description = defaultDescription,
  keywords,
  image = defaultImage,
  url,
  type = 'website',
  noindex = false,
  nofollow = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  const robotsContent = [];
  if (noindex) robotsContent.push('noindex');
  if (nofollow) robotsContent.push('nofollow');
  if (robotsContent.length === 0) robotsContent.push('index', 'follow');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent.join(', ')} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Additional Meta Tags */}
      <meta name="author" content={siteName} />
      <meta name="theme-color" content="#0d9488" />
    </Helmet>
  );
}
