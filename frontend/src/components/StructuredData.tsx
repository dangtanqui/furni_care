import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  data: object | object[];
}

export default function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];
  
  return (
    <Helmet>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </Helmet>
  );
}

// Helper functions to generate common schemas
export const generateOrganizationSchema = (url: string, name: string, logo?: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name,
  url,
  ...(logo && { logo: `${url}${logo}` }),
});

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const generateWebApplicationSchema = (name: string, url: string, description: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name,
  url,
  description,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
});

