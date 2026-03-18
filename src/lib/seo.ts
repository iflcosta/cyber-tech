import { brand } from './brand';

/**
 * Generates JSON-LD for LocalBusiness (Schema.org)
 */
export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    "name": brand.name,
    "alternateName": brand.slogan,
    "url": brand.url,
    "logo": `${brand.url}/logo.png`,
    "description": brand.description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": `${brand.address.street}, ${brand.address.number}`,
      "addressLocality": brand.address.city,
      "addressRegion": "SP",
      "postalCode": "12900-000",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": brand.address.coords.lat,
      "longitude": brand.address.coords.lng
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "13:00"
      }
    ],
    "sameAs": [
      brand.social.instagram,
      brand.social.facebook
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": brand.phone,
      "contactType": "customer service",
      "areaServed": "BR",
      "availableLanguage": "Portuguese"
    }
  };
}

/**
 * Generates JSON-LD for an individual Product
 */
export function getProductSchema(product: any) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image_urls?.[0] || `${brand.url}/placeholder.jpg`,
    "description": `${product.name} - ${product.category}. Disponível na Cyber Informática Bragança.`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Cyber Informática"
    },
    "offers": {
      "@context": "https://schema.org",
      "@type": "Offer",
      "url": `${brand.url}/showroom?product=${product.id}`,
      "priceCurrency": "BRL",
      "price": product.price_estimate,
      "availability": product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };
}
