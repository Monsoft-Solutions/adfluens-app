import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: APIContext) {
  // Remove trailing slash from site URL
  const site = (context.site?.toString() ?? "https://adfluens.io").replace(
    /\/$/,
    ""
  );

  // Get all blog posts
  const posts = await getCollection("blog");

  // Static pages
  const staticPages = [
    { path: "", priority: "1.0" },
    { path: "about", priority: "0.8" },
    { path: "pricing", priority: "0.9" },
    { path: "blog", priority: "0.8" },
    { path: "privacy", priority: "0.3" },
    { path: "terms", priority: "0.3" },
    { path: "features/ai-content", priority: "0.8" },
    { path: "features/gmb", priority: "0.8" },
    { path: "features/meta", priority: "0.8" },
    { path: "features/analytics", priority: "0.8" },
  ];

  // Build URL entries
  const staticUrls = staticPages.map(
    ({ path, priority }) => `  <url>
    <loc>${site}${path ? `/${path}/` : "/"}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
  );

  const blogUrls = posts.map(
    (post) => `  <url>
    <loc>${site}/blog/${post.slug}/</loc>
    <lastmod>${post.data.updatedAt?.toISOString().split("T")[0] ?? post.data.publishedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join("\n")}
${blogUrls.join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
