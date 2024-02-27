/* global process */
require('dotenv').config()
const axios = require('axios')
const TOKEN_SIGNALWIRE = process.env.TOKEN_SIGNALWIRE
const validatePhoneSignalwire = async phone => {
  let config = {
    method: 'get',
    url: `https://greetline-llc.signalwire.com/api/relay/rest/lookup/phone_number/%2B${phone}?include=carrier,cnam`, // rem carrier i.e not needed
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${TOKEN_SIGNALWIRE}`,
    },
  }

  try {
    const res = await axios(config)
    // console.log(res?.data)
    return res?.data?.cnam?.caller_id || 'None'
  } catch (e) {
    console.log(e?.message)
    return 'Not Found'
  }
}
// validatePhoneSignalwire('64274533559').then(console.log)
// validatePhoneSignalwire('447770510576').then(console.log)
// validatePhoneSignalwire('14169314476').then(console.log)
module.exports = validatePhoneSignalwire
