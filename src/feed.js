import * as cheerio from 'cheerio';

const UA = 'RssFeedTracker/0.1 (+contact: rss-tracker-admin@example.com)';
const MAX_SUMMARY_LENGTH = 1000;

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { ...options, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.ok) return res;
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`Feed request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`Feed request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

function truncate(text) {
    if (!text) return null;
    const trimmed = text.trim();
    return trimmed.length > MAX_SUMMARY_LENGTH ? `${trimmed.slice(0, MAX_SUMMARY_LENGTH)}…` : trimmed;
}

function parseEntry($, el, isAtom) {
    const $el = $(el);
    const title = $el.find('title').first().text().trim() || null;

    let link;
    let dateStr;
    let guid;
    let summary;

    if (isAtom) {
        let linkEl = $el.find('link[rel="alternate"]').first();
        if (linkEl.length === 0) linkEl = $el.find('link').first();
        link = linkEl.attr('href') ?? null;
        dateStr = $el.find('published').first().text() || $el.find('updated').first().text();
        guid = $el.find('id').first().text() || null;
        summary = $el.find('summary').first().text() || $el.find('content').first().text();
    } else {
        link = $el.find('link').first().text().trim() || null;
        dateStr = $el.find('pubdate').first().text() || $el.find('pubDate').first().text();
        guid = $el.find('guid').first().text() || null;
        summary = $el.find('description').first().text();
    }

    return {
        title,
        link,
        publishedAt: dateStr ? new Date(dateStr).toISOString() : null,
        guid,
        summary: truncate(summary),
    };
}

export async function fetchPosts({ feedUrl, startDate, maxResults }) {
    const res = await fetchWithRetry(feedUrl, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    let entries = $('item').toArray();
    let isAtom = false;
    if (entries.length === 0) {
        entries = $('entry').toArray();
        isAtom = true;
    }
    if (entries.length === 0) throw new Error('No <item> or <entry> elements found — not a recognized RSS/Atom feed');

    return entries
        .map((el) => parseEntry($, el, isAtom))
        .filter((post) => post.publishedAt && new Date(post.publishedAt) >= startDate)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, maxResults)
        .map((post) => ({ feedUrl, ...post }));
}
