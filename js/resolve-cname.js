const { log } = require('console')
const axios = require('axios')

const resolveDns = async domain => {
  const response = await axios.get(`https://dns.google/resolve?name=${domain}&type=CNAME`)
  const { Answer, Status, Comment } = response.data
  if (Status === 0 && Answer && Answer.length > 0) {
    const { name, TTL, data } = Answer[0]
    log({ name, TTL, data })
    return true
  }

  log(`Failed to fetch CNAME records for ${domain} Status: ${Status}. Comment: ${Comment}`)
  return false
}
// resolveDns('adil.sbs').then(log);
module.exports = resolveDns
