<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">

  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>XML Sitemap — Cozy Nest Ideas</title>
        <style>
          :root { color-scheme: light; --paper:#fbf8f4; --ink:#292521; --muted:#756e67; --rule:#ddd5cc; --clay:#a65f46; --sand:#eee5da; }
          * { box-sizing:border-box; }
          body { margin:0; background:var(--paper); color:var(--ink); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
          header { border-bottom:1px solid var(--rule); background:linear-gradient(135deg,#f4ece3 0%,#fbf8f4 70%); }
          .wrap { width:min(1120px,calc(100% - 36px)); margin:0 auto; }
          .header-inner { padding:64px 0 54px; }
          .eyebrow { margin:0 0 14px; color:var(--clay); font-size:12px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
          h1 { margin:0; font-family:Georgia,"Times New Roman",serif; font-size:clamp(40px,7vw,72px); font-weight:500; line-height:1; letter-spacing:-.035em; }
          .intro { max-width:680px; margin:20px 0 0; color:var(--muted); font-size:17px; line-height:1.7; }
          .summary { display:flex; flex-wrap:wrap; gap:12px 28px; margin-top:28px; padding-top:22px; border-top:1px solid var(--rule); color:var(--muted); font-size:13px; }
          .summary strong { color:var(--ink); font-size:15px; }
          main { padding:42px 0 72px; }
          .panel { overflow:hidden; border:1px solid var(--rule); background:#fff; box-shadow:0 16px 45px rgba(62,48,38,.05); }
          .panel-head { display:grid; grid-template-columns:72px 1fr; gap:20px; padding:15px 22px; background:var(--sand); color:var(--muted); font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
          ol { margin:0; padding:0; list-style:none; counter-reset:urls; }
          li { display:grid; grid-template-columns:72px minmax(0,1fr); gap:20px; align-items:center; min-height:62px; padding:14px 22px; border-top:1px solid var(--rule); counter-increment:urls; }
          li:first-child { border-top:0; }
          li:before { content:counter(urls,decimal-leading-zero); color:#a79e95; font-family:Georgia,"Times New Roman",serif; font-size:18px; }
          a { color:var(--ink); font-size:14px; line-height:1.5; overflow-wrap:anywhere; text-decoration:none; }
          a:hover { color:var(--clay); text-decoration:underline; text-underline-offset:4px; }
          footer { padding:0 0 42px; color:var(--muted); font-size:12px; text-align:center; }
          @media (max-width:600px) { .header-inner{padding:44px 0 38px}.panel-head,li{grid-template-columns:42px 1fr;gap:10px;padding-left:14px;padding-right:14px}a{font-size:12px} }
        </style>
      </head>
      <body>
        <header>
          <div class="wrap header-inner">
            <p class="eyebrow">Cozy Nest Ideas</p>
            <h1>XML Sitemap</h1>
            <p class="intro">A structured directory of the pages and articles available to search engines. Each address below is live and can be opened directly.</p>
            <div class="summary">
              <span><strong><xsl:value-of select="count(sm:urlset/sm:url | sm:sitemapindex/sm:sitemap)" /></strong> entries</span>
              <span>Generated automatically</span>
              <span>Search-engine ready</span>
            </div>
          </div>
        </header>

        <main class="wrap">
          <div class="panel">
            <div class="panel-head"><span>No.</span><span>Address</span></div>
            <ol>
              <xsl:for-each select="sm:urlset/sm:url | sm:sitemapindex/sm:sitemap">
                <li>
                  <a href="{sm:loc}"><xsl:value-of select="sm:loc" /></a>
                </li>
              </xsl:for-each>
            </ol>
          </div>
        </main>

        <footer class="wrap">This presentation layer does not change the underlying XML sitemap.</footer>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
