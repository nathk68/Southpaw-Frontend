import * as cheerio from 'cheerio';

export interface UFCEvent {
  title: string;
  date: string;
  dateISO: string;
  location: string;
  url: string;
  imgUrl: string;
  mainCard: string;
  eventType: string;
  eventNumber?: string;
}

// No need for complex date parsing - UFC provides Unix timestamps!

/**
 * Scrapes upcoming UFC events from the official UFC website
 * @returns Array of UFC events with fighter info, dates, and locations
 */
export async function getUpcomingFights(): Promise<UFCEvent[]> {
  try {
    const response = await fetch('https://www.ufc.com/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const events: UFCEvent[] = [];

    $('.c-card-event--result__info').each((_, element) => {
      const $element = $(element);

      const headline = $element.find('.c-card-event--result__headline a');
      const title = headline.text().trim();
      const urlRelative = headline.attr('href') || '';

      // Get the date element and extract timestamp
      const dateElement = $element.find('.c-card-event--result__date');
      const date = dateElement.text().trim();
      const timestamp = dateElement.attr('data-main-card-timestamp');

      const location = $element.find('.field--name-venue').text().trim() || 'TBA';

      const eventCard = $element.closest('.c-card-event--result');
      let imgUrl = eventCard.find('image').attr('href') ||
                   eventCard.find('img').attr('src') ||
                   'https://www.ufc.com/themes/custom/ufc/logo.svg';

      if (imgUrl && !imgUrl.startsWith('http')) {
        imgUrl = `https://www.ufc.com${imgUrl}`;
      }

      // Extract event type and number from URL (more reliable than title)
      const urlMatch = urlRelative.match(/ufc-(\d+)/);
      const eventNumber = urlMatch ? urlMatch[1] : undefined;

      // Determine event type based on event number
      const eventType = eventNumber ? `UFC ${eventNumber}` : 'UFC FIGHT NIGHT';
      const mainCard = title; // Use full title for fighter names

      if (title && timestamp) {
        // Convert Unix timestamp to Date - SIMPLE!
        const eventDate = new Date(parseInt(timestamp) * 1000);
        const now = new Date();

        // Simple comparison: if event_date >= now, show it
        if (eventDate >= now) {
          events.push({
            title,
            date,
            dateISO: eventDate.toISOString(),
            location,
            url: urlRelative.startsWith('http') ? urlRelative : `https://www.ufc.com${urlRelative}`,
            imgUrl,
            mainCard,
            eventType,
            eventNumber
          });
        }
      }
    });

    // Return all future events, no limit
    return events;
  } catch (error) {
    console.error('UFC Scraping Error:', error);
    return [];
  }
}
