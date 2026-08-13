import { Actor, log } from 'apify';
import { fetchPosts } from './feed.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { feedUrls = [], daysBack = 7, maxResultsPerFeed = 20 } = input;

if (feedUrls.length === 0) {
    throw new Error('No feedUrls provided.');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const FEED_CHECKED_EVENT = 'feed-checked';

const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

for (const feedUrl of feedUrls) {
    let posts;
    try {
        posts = await fetchPosts({
            feedUrl: feedUrl.trim(),
            startDate,
            maxResults: Math.min(maxResultsPerFeed, 100),
        });
    } catch (err) {
        log.warning(`Failed to fetch feed`, { feedUrl, error: err.message });
        continue;
    }

    if (posts.length > 0) {
        await Actor.pushData(posts);
    }
    await Actor.charge({ eventName: FEED_CHECKED_EVENT });

    log.info(`Checked feed`, { feedUrl, postsFound: posts.length });
}

await Actor.exit();
