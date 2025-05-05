import dotenv from "dotenv";

// const UitSearchAPIURI = "https://search-test.uitdatabank.be";
const UitSearchAPIURI = "https://search-test.uitdatabank.be";

/**
 * @typedef {Object} Filters
 * @property {string} postcode
//  * @property {string[]} categories
//  * @property {number} [page]
//  * @property {number} [pageSize]
 */

/**
 * @param {Filters} filters
 * @returns {Promise<any[]>}
 */
export const getUitEventDecodedList = async (filters) => {
  const { postalCode } = filters;
  console.log(filters);
  console.log(postalCode);
  dotenv.config();

  console.log("Client ID:", process.env.UIT_CLIENT_ID);

  try {
    const events = await fetch(
      UitSearchAPIURI +
        "/events" +
        "?bookingAvailability=Available" +
        "&languages[]=nl" +
        "&status=Available" +
        "&q=address.nl.addressLocality:Antwerpen" + // can filter on province or postalcode
        (postalCode ? "&postalCode=" + postalCode : ""),
      {
        method: "GET",
        headers: {
          "X-Client-Id": process.env.UIT_CLIENT_ID,
        },
      }
    );
    const encodedEvents = await events.json();
    console.log(encodedEvents);
    const decodedEvents = await handleEventListDecode(encodedEvents.member);
    console.log(decodedEvents);
    return decodedEvents;
  } catch (error) {
    console.error(error);
  }

  // console.log(events.body);
};

const handleEventListDecode = async (eventList) => {
  const decodedEventsList = [];
  for (const event of eventList) {
    // console.log(event);
    console.log(event["@id"]);
    const response = await fetch(event["@id"], {
      method: "GET",
      headers: {
        "X-Client-Id": process.env.UIT_CLIENT_ID,
      },
    });
    const decodedEvent = await response.json();
    //console.log(decodedEvent);
    // const decodedEvent = await decoedEvent.json();
    decodedEventsList.push(decodedEvent);
  }
  return decodedEventsList;
};
