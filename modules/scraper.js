import * as cheerio from "cheerio";
import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from 'fs';

async function searchGoogleMaps(query) {
  try {
    const start = Date.now();

    puppeteerExtra.use(stealthPlugin());

    const browser = await puppeteerExtra.launch({
      // headless: false,
      headless: "new",
      // devtools: true,
      executablePath: "", // your path here
    });

    const page = await browser.newPage();

    try {
      await page.goto(
        `https://www.google.com/maps/search/${query.split(" ").join("+")}`
      );
    } catch (error) {
      console.log("error going to page");
    }

    async function autoScroll(page) {
      await page.evaluate(async () => {
        const wrapper = document.querySelector('div[role="feed"]');

        await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 1000;
          var scrollDelay = 3000;

          var timer = setInterval(async () => {
            var scrollHeightBefore = wrapper.scrollHeight;
            wrapper.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeightBefore) {
              totalHeight = 0;
              await new Promise((resolve) => setTimeout(resolve, scrollDelay));

              // Calculate scrollHeight after waiting
              var scrollHeightAfter = wrapper.scrollHeight;

              if (scrollHeightAfter > scrollHeightBefore) {
                // More content loaded, keep scrolling
                return;
              } else {
                // No more content loaded, stop scrolling
                clearInterval(timer);
                resolve();
              }
            }
          }, 700);
        });
      });
    }

    await autoScroll(page);

    const html = await page.content();
    const pages = await browser.pages();
    await Promise.all(pages.map((page) => page.close()));

    await browser.close();
    console.log("browser closed");

    // get all a tag parent where a tag href includes /maps/place/
    const $ = cheerio.load(html);
    const aTags = $("a");
    const parents = [];

    // click on each a tag that includes /maps/place/ to open the business details
    aTags.each((i, el) => {
      const href = $(el).attr("href");
      if (!href) {
        return;
      }
      if (href.includes("/maps/place/")) {
        parents.push($(el).parent());
      }
    });

    console.log(parents.length, "parents found");

    // write the parents to a file
    fs.openSync("parent.html", "w");

    const business = [];
    let index = 0;

    parents.forEach((parent) => {
      // write the parent to a file
      fs.writeFileSync("parent.html", parent.html(), { flag: "a" });

      const url = parent.find("a").attr("href");
      // get a tag where data-value="Website"
      const website = parent.find('a[data-value="Website"]').attr("href");
      // find a div that includes the class fontHeadlineSmall
      const storeName = parent.find("div.fontHeadlineSmall").text();
      // find span that includes class fontBodyMedium
      const ratingText = parent
        .find("span.fontBodyMedium > span")
        .attr("aria-label");

      // get the first div that includes the class fontBodyMedium
      const bodyDiv = parent.find("div.fontBodyMedium").first();
      const children = bodyDiv.children();
      const lastChild = children.last();
      const firstOfLast = lastChild.children().first();
      const lastOfLast = lastChild.children().last();
      // console.log(lastOfLast.text());
      index = index + 1;

      // Extract stars and number of reviews from ratingText
      let stars = null;
      let numberOfReviews = null;
      if (ratingText) {
        const ratingTextParts = ratingText.split(" ");
        stars = parseFloat(ratingTextParts[1].replace(",", "."));
        numberOfReviews = parseInt(ratingTextParts[2].replace(".", ""));
      }

      // Push extracted data to business array
      business.push({
        index,
        storeName,
        placeId: `ChI${url?.split("?")?.[0]?.split("ChI")?.[1]}`,
        address: firstOfLast?.text()?.split("·")?.[1]?.trim(),
        category: firstOfLast?.text()?.split("·")?.[0]?.trim(),
        phone: lastOfLast?.text()?.split("·")?.[1]?.trim(),
        googleUrl: url,
        bizWebsite: website,
        ratingText,
        stars,
        numberOfReviews,
      });
    });
    const end = Date.now();

    console.log(`scrapped in ${Math.floor((end - start) / 1000)} seconds`);

    return business;
  } catch (error) {
    console.log("error at googleMaps", error.message);
  }
}

export default {
  searchGoogleMaps,
};