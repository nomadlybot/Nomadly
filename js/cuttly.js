/* global process */
require('dotenv').config()
const axios = require('axios')
const apiKey = process.env.API_CUTTLY

const createShortUrlCuttly = async longUrl => {
  const cuttlyApiUrl = `https://cutt.ly/api/api.php?key=${apiKey}&short=${encodeURIComponent(longUrl)}`

  const response = await axios.get(cuttlyApiUrl)
  const { status, shortLink } = response.data.url
  if (status === 7) {
    return shortLink
  } else {
    console.error('Error creating short URL:', response.data.url.msg)
  }
}
// createShortUrlCuttly('https://web.telegram.org/k/#@softlocalbot').then(console.log)
module.exports = createShortUrlCuttly
