# Blog & RSS Feed Tracker — New Posts by Feed

Track new posts from any blog or news RSS/Atom feed — a competitor's
blog, an industry publication, a company you're watching. Get the title,
link, publish date, and summary the moment a new post goes live, without
checking the feed by hand.

Built for marketing, competitive intelligence, and PR teams monitoring
multiple sources at once.

## Input

```json
{
  "feedUrls": ["https://techcrunch.com/feed/"],
  "daysBack": 7,
  "maxResultsPerFeed": 20
}
```

| Field | Type | Description |
|---|---|---|
| `feedUrls` | array of strings | RSS or Atom feed URLs. One lookup is billed per feed. |
| `daysBack` | number | Only return posts published within this many days of today. Default `7`, max `90`. |
| `maxResultsPerFeed` | number | Max posts to return per feed, most recent first. Default `20`, max `100`. |

## Output

One record per post:

```json
{
  "feedUrl": "https://techcrunch.com/feed/",
  "title": "In a first, US will allow some private firms to carry out cyberattacks",
  "link": "https://techcrunch.com/2026/08/13/in-a-first-us-will-allow-some-private-firms-to-carry-out-cyberattacks/",
  "publishedAt": "2026-08-13T14:09:05.000Z",
  "guid": "https://techcrunch.com/?p=3152695",
  "summary": "The new order sweeps away decades of existing U.S. cybersecurity policy..."
}
```

A feed with no posts in the requested window returns no items but is
still billed once for the lookup.

## How it works

Fetches and parses the feed URL directly — supports both RSS 2.0 and
Atom formats. No proxy, no key. RSS/Atom feeds are the format sites
deliberately publish for exactly this kind of automated consumption.

## Pricing note

Billed per **feed checked**, not per post returned — one charge per feed
whether it has 0 or 100 matching posts.

## Related products

- [Hacker News Keyword Tracker](https://github.com/timmKal01/hacker-news-keyword-tracker) — new mentions of a keyword, if you're watching for a topic rather than a specific source
- [GitHub Release Tracker](https://github.com/timmKal01/github-release-tracker) — new releases for repos you depend on, a narrower feed type than general blog/news RSS
