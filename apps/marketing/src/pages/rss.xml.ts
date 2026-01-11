import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import type { CollectionEntry } from "astro:content";

export async function GET(context: APIContext) {
  const posts = await getCollection("blog");

  // Sort by date, newest first
  const sortedPosts = posts.sort(
    (a: CollectionEntry<"blog">, b: CollectionEntry<"blog">) =>
      b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );

  return rss({
    title: "Adfluens Blog",
    description:
      "Tips, strategies, and insights for social media growth. Learn how to amplify your presence with AI-powered tools.",
    site: context.site ?? "https://adfluens.io",
    items: sortedPosts.map((post: CollectionEntry<"blog">) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.excerpt,
      link: `/blog/${post.slug}/`,
      categories: [post.data.category],
      author: post.data.author,
    })),
    customData: `<language>en-us</language>`,
  });
}
