import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE = 'https://stocksensee.netlify.app';

interface SeoProps {
  title: string;
  description: string;
  /** Override the canonical path (defaults to the current route). */
  path?: string;
  noindex?: boolean;
}

const Seo = ({ title, description, path, noindex }: SeoProps) => {
  const location = useLocation();
  const url = `${SITE}${path ?? location.pathname}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
};

export default Seo;
