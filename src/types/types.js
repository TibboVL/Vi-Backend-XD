/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} context
 * @property {Object} name
 * @property {string} name.nl
 * @property {Object} description
 * @property {string} description.nl
 * @property {string} availableFrom
 * @property {string} availableTo
 * @property {string[]} [labels]
 * @property {Location} location
 * @property {Organizer} organizer
 * @property {BookingInfo} bookingInfo
 * @property {ContactPoint} contactPoint
 * @property {PriceInfo[]} priceInfo
 * @property {Term[]} terms
 * @property {string} creator
 * @property {string} created
 * @property {string} modified
 * @property {string} publisher
 * @property {'single' | 'multiple' | 'periodic'} calendarType
 * @property {string} startDate
 * @property {string} endDate
 * @property {SubEvent[]} subEvent
 * @property {Performer[]} performer
 * @property {string[]} sameAs
 * @property {string[]} seeAlso
 * @property {'APPROVED' | 'REJECTED'} workflowStatus
 * @property {Audience} audience
 * @property {'nl'} mainLanguage
 * @property {string[]} languages
 * @property {string[]} completedLanguages
 * @property {MediaObject[]} mediaObject
 * @property {string} image
 * @property {null} production
 * @property {Status} status
 * @property {BookingAvailability} bookingAvailability
 * @property {string} typicalAgeRange
 * @property {'offline' | 'online' | 'mixed'} attendanceMode
 */

/**
 * @typedef {Object} Location
 * @property {string} id
 * @property {string} context
 * @property {Object} description
 * @property {string} description.nl
 * @property {Object} name
 * @property {string} name.nl
 * @property {string} creator
 * @property {string} created
 * @property {string} modified
 * @property {string} publisher
 * @property {string} availableFrom
 * @property {string} availableTo
 * @property {string[]} sameAs
 * @property {'REJECTED' | 'APPROVED'} workflowStatus
 * @property {Address} address
 * @property {ContactPoint} contactPoint
 * @property {string[]} labels
 * @property {Term[]} terms
 * @property {'permanent' | 'temporary'} calendarType
 * @property {OpeningHours[]} openingHours
 * @property {'nl'} mainLanguage
 * @property {string[]} languages
 * @property {string[]} completedLanguages
 * @property {Geo} geo
 * @property {Status} status
 * @property {BookingAvailability} bookingAvailability
 * @property {string} typicalAgeRange
 * @property {number} playhead
 * @property {number} completeness
 */

/**
 * @typedef {Object} Organizer
 * @property {string} name
 * @property {string[]} email
 * @property {string[]} phone
 * @property {'Organizer'} type
 */

/**
 * @typedef {Object} BookingInfo
 * @property {string} [priceCurrency]
 * @property {number} [price]
 * @property {string} phone
 */

/**
 * @typedef {Object} ContactPoint
 * @property {string[]} [email]
 * @property {string[]} [phone]
 * @property {string[]} [url]
 */

/**
 * @typedef {Object} PriceInfo
 * @property {string} category
 * @property {Object} name
 * @property {string} name.nl
 * @property {string} [name.fr]
 * @property {string} [name.en]
 * @property {string} [name.de]
 * @property {number} price
 * @property {string} priceCurrency
 */

/**
 * @typedef {Object} Term
 * @property {string} label
 * @property {string} domain
 * @property {string} id
 */

/**
 * @typedef {Object} SubEvent
 * @property {number} id
 * @property {Status} status
 * @property {BookingAvailability} bookingAvailability
 * @property {'Event'} type
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @typedef {Object} Performer
 * @property {string} name
 */

/**
 * @typedef {Object} Audience
 * @property {'everyone'} audienceType
 */

/**
 * @typedef {Object} MediaObject
 * @property {string} id
 * @property {'schema:ImageObject'} type
 * @property {string} contentUrl
 * @property {string} thumbnailUrl
 * @property {string} description
 * @property {string} copyrightHolder
 * @property {string} inLanguage
 * @property {string} id
 */

/**
 * @typedef {Object} Address
 * @property {Object} nl
 * @property {string} nl.addressCountry
 * @property {string} nl.addressLocality
 * @property {string} nl.postalCode
 * @property {string} nl.streetAddress
 */

/**
 * @typedef {Object} OpeningHours
 * @property {string} opens
 * @property {string} closes
 * @property {Array<'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday'>} dayOfWeek
 */

/**
 * @typedef {Object} Geo
 * @property {number} latitude
 * @property {number} longitude
 */

/**
 * @typedef {Object} Status
 * @property {'Available' | 'Unavailable'} type
 */

/**
 * @typedef {Object} BookingAvailability
 * @property {'Available' | 'Unavailable'} type
 */

export {};
