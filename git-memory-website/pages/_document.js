import { Html, Head, Main, NextScript } from 'next/document';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Analytics */}
        {GA_TRACKING_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        
        {/* Meta tags for better SEO and analytics */}
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        
        {/* Open Graph meta tags for social sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Git Memory MCP Server" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@gitmemory" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}