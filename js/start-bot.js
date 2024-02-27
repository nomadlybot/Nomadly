const axios = require('axios')
const { log } = require('console')
const { convert } = require('./pay-blockbee')
const { getBusinessId } = require('./pay-fincra')
const { isRailwayAPIWorking } = require('./rl-save-domain-in-server')
// const { getRegisteredDomainNames } = require('./get-purchased-domains.test');

const runBot = async () => {
  try {
    axios.get('https://api.ipify.org/').then(ip => {
      const message = `Please add \`\`\`${ip.data}\`\`\` to whitelist in Connect Reseller, API Section. https://global.connectreseller.com/tools/profile`
      console.log(message)
    })

    await getBusinessId()
    console.log('working, fincra api')
    // await getRegisteredDomainNames();
    // console.log('working, connect reseller api');
    convert('1', 'btc', 'usd').then(a => log('working, blockbee api, btc price usd', a))
    convert('1', 'polygon_matic', 'usd').then(a => log('matic price usd', a))
    await isRailwayAPIWorking()
    console.log('working, railway api, now starting the bot')

    require('./_index.js')
  } catch (error) {
    console.error('Error is:', error)
    console.error(
      'Error is:',
      error?.message,
      error?.response?.data,
      error?.cause,
      JSON.stringify(error?.response?.data, null, 2),
    )
  }
}

runBot()
