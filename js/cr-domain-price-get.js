/* global process */
require('dotenv').config()
const axios = require('axios')
const API_KEY = process.env.API_KEY_CONNECT_RESELLER
const PERCENT_INCREASE_DOMAIN = 1 + Number(process.env.PERCENT_INCREASE_DOMAIN)

// Function to test domain availability
async function checkDomainPriceOnline(domainName) {
    const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkDomainPrice?APIKey=${API_KEY}&websiteName=${domainName}`

  let response

  try {
    response = await axios.get(apiUrl)
    const statusCode = response?.data?.responseMsg?.statusCode

    if (statusCode === 200) {
      const premiumPrice = response?.data?.responseData?.domainCheckResponce?.[0]?.creationSellFee
      // console.log(JSON.stringify(response.data, 0, 2))
      if (premiumPrice) return { available: true, price: premiumPrice, originalPrice: premiumPrice }
      const [domainId] = Object.keys(response.data.responseData)
      const price1Year = Number(
        response?.data?.responseData[domainId]
          ?.find(entry => entry.description.includes('Registration Price for 1 Year'))
          .description.split('is ')[1],
      )

      const price = Math.ceil(price1Year * PERCENT_INCREASE_DOMAIN)
      return { available: true, originalPrice: price1Year, price: price > 5 ? price : 6 }
    } else if (statusCode === 400) {
      return {
        available: false,
        message: 'domain name not available please try another domain name',
      }
    } else {
      return { available: false, message: 'invalid domain name' }
    }
  } catch (error) {
    const message = `An error occurred while checking domain availability. Maybe IP Not Whitelisted. ${error.message}`
    console.error('checkDomainPriceOnline', JSON.stringify(response?.data, null, 2), message)
    return {
      available: false,
      message,
    }
  }
}
// checkDomainPriceOnline('golagolasoft.com').then(console.log);

module.exports = { checkDomainPriceOnline }
