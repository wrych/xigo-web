import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { newestFirst } from "../journal";
import { allPosts } from "../posts";

export async function GET(context: APIContext) {
  if (context.site === undefined) {
    throw new Error("astro.config.mjs must set `site` for the feed's links");
  }
  const posts = newestFirst(await allPosts());
  return rss({
    title: "xigo — Journal",
    description: "Notes on self-organization, decisions and change, from xigo.",
    site: context.site,
    trailingSlash: false,
    xmlns: { dc: "http://purl.org/dc/elements/1.1/" },
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      customData: `<dc:creator>${post.data.author}</dc:creator>`,
      link: `/journal/${post.id}`,
    })),
  });
}
