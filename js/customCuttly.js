/* global process */
require('dotenv').config()
const axios = require('axios')
const apiKey = process.env.API_CUTTLY

const createCustomShortUrlCuttly = async (longUrl, name) => {
  const cuttlyApiUrl = `https://cutt.ly/api/api.php?key=${apiKey}&short=${encodeURIComponent(longUrl)}&name=${name}`

  const response = await axios.get(cuttlyApiUrl)
  const { status, shortLink } = response.data.url
    if (status === 7) {
    return shortLink
  } else {
    console.error('createCustomShortUrlCuttly Error creating short URL:', response.data.url.msg)
  }
}

module.exports = createCustomShortUrlCuttly
