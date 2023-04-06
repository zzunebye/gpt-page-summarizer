import { OpenAIModel } from "../types/types";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

import * as cheerio from "cheerio";
import { isProbablyReaderable, Readability } from "@mozilla/readability";

function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

function createPrompt(
  url: string,
  summaryLength: number,
  targetLang: string,
  article:
    | {
        title: string;
        content: string;
        textContent: string;
        length: number;
        excerpt: string;
        byline: string;
        dir: string;
        siteName: string;
        lang: string;
      }
    | string
) {
  let prompt = "";
  if (typeof article === "string") {
    prompt = `Summarize this content in ${summaryLength} words:
    URL: ${url} 
    Content: ${article}
    `;
  } else {
    prompt = `Summarize this content in ${summaryLength} words using ${targetLang}:
    URL: ${url} 
    Title: ${article.title}
    excerpt: ${article.excerpt}
    Content: ${article.textContent.replace(/\s{2,}/g, " ")}
    Language: ${article.lang}`;
  }

  console.log("prompt: ", prompt);
  return prompt;
}

type Article =
  | string
  | {
      title: string;
      content: string;
      textContent: string;
      length: number;
      excerpt: string;
      byline: string;
      dir: string;
      siteName: string;
      lang: string;
    };

export async function getArticle(url: string): Promise<Article | void> {
  let article;

  try {
    const response = await fetch(url);
    let html = await response.text();
    // console.log("text", html);

    const doc = new DOMParser().parseFromString(html, "text/html");
    const isReaderable = isProbablyReaderable(doc, { minContentLength: 50 });
    console.log("isReaderable", isReaderable);

    if (isReaderable === true) {
      // article = new Readability(doc).parse();
      article = new Readability(doc).parse();
      console.dir(`article: ${article}`);
      console.dir(article?.length);
      console.dir(article?.textContent.replace(/\s{2,}/g, " ").length);
      console.dir(article?.textContent.replace(/\s{2,}/g, " ").trim().length);
    } else {
      const $ = cheerio.load(html);
      const text = $("p").text();
      article = text;
      console.log("text", text);
    }
  } catch (error) {
    console.log(error);
  }

  // Configure the OpenAI API client
  if (!isValidURL(url) || article === undefined || article === null) {
    return;
  }

  return article;
}

export async function summarizeArticle(
  url: string,
  apiKey: string,
  model: OpenAIModel,
  controller: AbortController,
  article: Article,
  options: { summaryLength: number; targetLang: string }
) {
  const prompt = createPrompt(
    url,
    options.summaryLength,
    options.targetLang,
    article
  );

  // Define the messages to be sent to ChatGPT
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant that summarizes articles.",
    },
    {
      role: "user",
      content: `${prompt}`,
    },
  ];

  try {
    const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: messages,
        temperature: 1.0,
        stream: true,
      }),
    });

    if (!res.ok) {
      const result = await res.text();
      throw new Error(`OpenAI API returned an error: ${res.status}/n${result}`);
    }

    // Create a new TransformStream to process the chunks from the response body
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const textDecoder = new TextDecoder();
        const text = textDecoder.decode(chunk);

        // Parse the response chunk
        const onParse = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === "event") {
            const data = event.data;

            if (data === "[DONE]") {
              controller.terminate();
              return;
            }

            try {
              const json = JSON.parse(data);
              const text = json.choices[0].delta.content;
              const textEncoder = new TextEncoder();
              const queue = textEncoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        };

        const parser = createParser(onParse);
        parser.feed(text);
      },
    });

    if (!res.body) {
      throw new Error("Response body is null.");
    }

    // Pipe the response body through the transformStream
    const stream = res.body.pipeThrough(transformStream);

    return stream;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Request was aborted");
    } else {
      throw error;
    }
  }
}
