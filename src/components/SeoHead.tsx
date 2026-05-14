import { Helmet } from "react-helmet-async";

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: object | object[];
}

/**
 * Per-route SEO head. Sets unique title, description, canonical, and og:* tags.
 * Title is auto-suffixed with " — Word Rumble" if not already branded.
 */
export function SeoHead({ title, description, path, jsonLd }: SeoHeadProps) {
  const fullTitle = title.includes("Word Rumble") ? title : `${title} — Word Rumble`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={path} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={path} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
