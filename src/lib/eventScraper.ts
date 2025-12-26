import * as cheerio from 'cheerio';

export interface Fight {
  fighter1: string;
  fighter2: string;
  fighter1Image?: string;
  fighter2Image?: string;
  weightClass: string;
  isTitleFight: boolean;
  order: number;
}

export interface EventDetails {
  title: string;
  date: string;
  location: string;
  mainCard: Fight[];
  preliminaryCard: Fight[];
  earlyPrelims: Fight[];
}

/**
 * Scrapes detailed event information including all fights
 */
export async function getEventDetails(eventSlug: string): Promise<EventDetails | null> {
  try {
    const url = `https://www.ufc.com/event/${eventSlug}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      next: { revalidate: 1800 }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const titlePrefix = $('.c-hero__headline-prefix').text().trim();
    const titleMain = $('.c-hero__headline.is-large-text').text().trim();
    const title = titlePrefix || titleMain || $('h1').first().text().trim();

    const dateText = $('.c-hero__headline-suffix').text().trim() ||
                     $('.c-hero__date').text().trim() ||
                     $('.field--name-field-fmEvent-date').text().trim();

    const locationText = $('.field--name-venue').first().text().replace(/\s+/g, ' ').trim() ||
                        $('.c-hero__location').text().replace(/\s+/g, ' ').trim() ||
                        $('.address').text().replace(/\s+/g, ' ').trim();

    const mainCard: Fight[] = [];
    const preliminaryCard: Fight[] = [];
    const earlyPrelims: Fight[] = [];

    const allFights: Fight[] = [];
    let order = 0;

    $('.c-listing-fight').each((_, fightElem) => {
      const $fight = $(fightElem);

      let fighter1 = '';
      let fighter2 = '';

      const redCornerName = $fight.find('.c-listing-fight__corner-name--red').text().replace(/\s+/g, ' ').trim();
      const blueCornerName = $fight.find('.c-listing-fight__corner-name--blue').text().replace(/\s+/g, ' ').trim();

      let fighter1Image = '';
      let fighter2Image = '';

      const redCorner = $fight.find('.c-listing-fight__corner--red');
      const blueCorner = $fight.find('.c-listing-fight__corner--blue');

      const redImageElem = redCorner.find('img').first();
      const blueImageElem = blueCorner.find('img').first();

      if (redImageElem.length) {
        let imgSrc = redImageElem.attr('src') || redImageElem.attr('data-src');
        if (imgSrc) {
          // Keep the full body image, will crop with CSS on frontend
          fighter1Image = imgSrc.startsWith('http') ? imgSrc : `https://www.ufc.com${imgSrc}`;
        }
      }

      if (blueImageElem.length) {
        let imgSrc = blueImageElem.attr('src') || blueImageElem.attr('data-src');
        if (imgSrc) {
          // Keep the full body image, will crop with CSS on frontend
          fighter2Image = imgSrc.startsWith('http') ? imgSrc : `https://www.ufc.com${imgSrc}`;
        }
      }

      if (redCornerName && blueCornerName) {
        fighter1 = redCornerName;
        fighter2 = blueCornerName;
      } else {
        const $corners = $fight.find('.c-listing-fight__corner-name');
        $corners.each((i, corner) => {
          const name = $(corner).text().replace(/\s+/g, ' ').trim();
          if (i === 0) fighter1 = name;
          if (i === 1) fighter2 = name;
        });
      }

      const classText = $fight.find('.c-listing-fight__class-text').first().text().replace(/\s+/g, ' ').trim();
      const weightClass = classText || 'Weight class TBA';

      const isTitleFight = weightClass.toLowerCase().includes('title') ||
                          weightClass.toLowerCase().includes('championship') ||
                          $fight.find('.c-listing-fight__belt').length > 0;

      if (fighter1 && fighter2) {
        allFights.push({
          fighter1,
          fighter2,
          fighter1Image: fighter1Image || undefined,
          fighter2Image: fighter2Image || undefined,
          weightClass,
          isTitleFight,
          order: order++
        });
      }
    });

    if (allFights.length > 0) {
      const totalFights = allFights.length;

      if (totalFights >= 8) {
        mainCard.push(...allFights.slice(0, 5));
        preliminaryCard.push(...allFights.slice(5, totalFights - 3));
        earlyPrelims.push(...allFights.slice(totalFights - 3));
      } else if (totalFights >= 5) {
        mainCard.push(...allFights.slice(0, 5));
        preliminaryCard.push(...allFights.slice(5));
      } else {
        mainCard.push(...allFights);
      }
    }

    return {
      title: title || 'Event Details',
      date: dateText || 'TBA',
      location: locationText || 'TBA',
      mainCard,
      preliminaryCard,
      earlyPrelims
    };
  } catch (error) {
    console.error('Event scraping error:', error);
    return null;
  }
}
