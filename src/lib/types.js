/**
 * @typedef {Object} CartLineItem
 * @property {string} catalogObjectId
 * @property {string} name
 * @property {number} quantity
 * @property {number} totalPrice
 * @property {string} [size]
 * @property {string} [milk]
 * @property {string|null} [syrup]
 * @property {string[]} [alterations]
 * @property {string} [customerNote]
 * @property {boolean} [fromExistingOrder]
 * @property {string} [category]
 * @property {string} [emoji]
 */

/**
 * @typedef {Object} ApiLineItem
 * @property {string} catalog_object_id
 * @property {number} quantity
 * @property {string} item_name
 * @property {number} unit_price
 * @property {string} [emoji]
 * @property {{name: string, price: number}[]} modifiers
 * @property {string} [customer_note]
 */

export const __types = {};
