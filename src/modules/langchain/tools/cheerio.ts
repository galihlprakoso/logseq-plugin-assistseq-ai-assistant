import { z } from "zod"
import * as cheerio from 'cheerio'

const schema = z.object({
  url: z
    .string()
    .describe("The website's URL you want to scrape.")
});

async function loadHTML(url: string) {
  const $ = await cheerio.fromURL(
    url,
  );
  return $;
}

function extractMainContent($: cheerio.CheerioAPI) {
  let mainContent = '';

  const selectors = [
    'article',
    'main',
    'div#content',
    'div.main-content',
    'div.content',
    'div#primary',
    'div.post-content',
    'div.entry-content',
    'div#main',
    'section.content',
    'div.page-content',
    'div#page',
    'div#article',
    'section.article-body',
    'div.story-body',
    'div.article-content',
    'div.text',
    'div.body-content',
    'div#main-content',
    'div#blog-post',
    'div#post',
    'div.post-body',
    'section.post-article',
    'div.article__body',
    'div.content__body',
    'div.rich-text',
    'section.rich-content',
    'div#pageBody',
    'div#articleBody',
    'section#main-article',
    'section.body-content',         
  ]

  for (const selector of selectors) {
    const content = $(selector).text().trim();
    if (content.length > mainContent.length) {
        mainContent = content;
    }
  }

  if (!mainContent) {
    mainContent = $('body').text().trim();
  }

  return mainContent;
}

function cleanContent(content: string) {
  
  content = content.replace(/\s+/g, ' ').trim();
  content = content.replace(/<\/?[^>]+(>|$)/g, '');  
  content = content.replace(/<script.*?>.*?<\/script>/gi, '');   
  content = content.replace(/<style.*?>.*?<\/style>/gi, '');     
  content = content.replace(/<!--.*?-->/gs, '');                 
  content = content.replace(/on\w+="[^"]*"/g, '');               
  content = content.replace(/style="[^"]*"/g, '');               
  content = content.replace(/(Read more|Share this|Tweet|Facebook|Instagram)/gi, '');
  content = content.replace(/(nav|footer|sidebar).*?<\/(nav|footer|aside)>/gi, '');
  content = content.replace(/(\r\n|\n|\r)/gm, '');               
  content = content.replace(/&nbsp;/g, ' ');
  content = content.replace(/&amp;/g, '&');
  content = content.replace(/&quot;/g, '"');
  content = content.replace(/&lt;/g, '<');
  content = content.replace(/&gt;/g, '>');
  content = content.replace(/&apos;/g, "'");  
  content = content.trim();

  return content;
}

export const getURLContentTool = async ({ url }: {
  url: string
}) => {
  const $ = await loadHTML(url);
  let mainContent = extractMainContent($);
  mainContent = cleanContent(mainContent);
  return mainContent;  
}

const NAME = "scrape_url"
const DESC = "Whenever you found website URL on user's input / query, you should use this tool to parse the website's data on that url."

export const cheerioTool = {
  schema,
  name: NAME,
  description: DESC,
}

export const cheerioToolGroq = {
  "type": "function",
  "function": {
      "name": NAME,
      "description": DESC,
      "parameters": {
          "type": "object",
          "properties": {
              "url": {
                  "type": "string",
                  "description": "The website's URL you want to scrape.",
              },
          },
          "required": ["url"],
      },
  },
}