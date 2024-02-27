/*global Buffer process */
const fs = require('fs')
require('dotenv').config()
const axios = require('axios')
const { t, timeOf, freeDomainsOf, o } = require('./config')
const { getAll, get, set } = require('./db')
const { log } = require('console')
const resolveDns = require('./resolve-cname.js')

const API_KEY_CURRENCY_EXCHANGE = process.env.API_KEY_CURRENCY_EXCHANGE
const UPDATE_DNS_INTERVAL = Number(process.env.UPDATE_DNS_INTERVAL || 60)
const PERCENT_INCREASE_USD_TO_NAIRA = Number(process.env.PERCENT_INCREASE_USD_TO_NAIRA)

function isValidUrl(url) {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/
  return urlRegex.test(url)
}

function isNormalUser(chatId) {
  return !isAdmin(chatId) && !isDeveloper(chatId)
}

function isDeveloper(chatId) {
  return chatId === Number(process.env.TELEGRAM_DEVELOPER_CHAT_ID) // Replace with the actual developer's chat ID
}

function isAdmin(chatId) {
  return chatId === Number(process.env.TELEGRAM_ADMIN_CHAT_ID) // Replace with the actual admin's chat ID
}

async function usdToNgn(amountInUSD) {
  try {
    const apiUrl = `https://openexchangerates.org/api/latest.json?app_id=${API_KEY_CURRENCY_EXCHANGE}`

    const response = await axios.get(apiUrl)
    const usdToNgnRate = response.data.rates['NGN']
    const nairaAmount = Number(amountInUSD) * usdToNgnRate * (1 + PERCENT_INCREASE_USD_TO_NAIRA)
    return Number(nairaAmount.toFixed())
  } catch (error) {
    console.error(`Error usdToNgn: ${error.message}`)
    return error.message
  }
}
// usdToNgn(1).then(log);

async function ngnToUsd(ngn) {
  try {
    const apiUrl = `https://openexchangerates.org/api/latest.json?app_id=${API_KEY_CURRENCY_EXCHANGE}`

    const response = await axios.get(apiUrl)
    const usdToNgnRate = response.data.rates['NGN']
    const usd = Number(ngn) / (usdToNgnRate * (1 + PERCENT_INCREASE_USD_TO_NAIRA))
    return usd
  } catch (error) {
    console.error(`Error ngnToUsd: ${error.message}`)
    return error.message
  }
}
// ngnToUsd(1000).then(log);
const addZero = number => (number < 10 ? '0' + number : number)
const date = () => {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = addZero(currentDate.getMonth() + 1)
  const day = addZero(currentDate.getDate())
  const hours = addZero(currentDate.getHours())
  const minutes = addZero(currentDate.getMinutes())
  const seconds = addZero(currentDate.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
function today() {
  const currentDate = new Date()
  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1 // Note: Months are 0-indexed
  const year = currentDate.getFullYear()

  const formattedDate = `${day}-${month}-${year}`
  return formattedDate
}
function week() {
  const currentDate = new Date()
  const startDate = new Date(currentDate.getFullYear(), 0, 1)
  const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil(days / 7)

  return year() + ' Week ' + weekNumber
}

function month() {
  const currentDate = new Date()
  return year() + ' Month ' + (currentDate.getMonth() + 1)
}
function year() {
  const currentDate = new Date()
  return 'Year ' + currentDate.getFullYear()
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

const regularCheckDns = (bot, chatId, domain) => {
  const checkDnsPropagation = async () => {
    if (await resolveDns(domain)) {
      bot.sendMessage(chatId, t.dnsPropagated.replace('{{domain}}', domain))
      clearInterval(intervalDnsPropagation)
      return
    }
    bot.sendMessage(chatId, t.dnsNotPropagated.replace('{{domain}}', domain))
  }
  const intervalDnsPropagation = setInterval(checkDnsPropagation, UPDATE_DNS_INTERVAL * 1000)

  setTimeout(() => {
    clearInterval(intervalDnsPropagation)
  }, 60 * 60 * 1000)
}

const getRandom = n => Math.floor(Math.random() * n)

const nextNumber = arr => {
  let n = 1
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === n) n++
    else return n
  }
  return n
}

const sendMessageToAllUsers = async (bot, message, method, nameOf, myChatId) => {
  const chatIds = await getChatIds(nameOf)
  const total = chatIds.length
  bot.sendMessage(myChatId, `Total users: ${total}`)
  for (let i = 0; i < total; i++) bot[method](chatIds[i], message, o).catch(err => log(err.message, chatIds[i]))
}

const getChatIds = async nameOf => {
  let ans = await getAll(nameOf)
  if (!ans) return []
  return ans.map(a => a._id)
}

const sendQrCode = async (bot, chatId, bb) => {
  const qrCode = await bb.getQrcode()
  const buffer = Buffer.from(qrCode?.qr_code, 'base64')
  fs.writeFileSync('image.png', buffer)
  bot
    .sendPhoto(chatId, 'image.png', {
      caption: 'Here is your QR code!',
    })
    .then(() => fs.unlinkSync('image.png'))
    .catch(log)
}

const getBalance = async (walletOf, chatId) => {
  const wallet = await get(walletOf, chatId)

  const usdBal = (wallet?.usdIn || 0) - (wallet?.usdOut || 0)

  const ngnIn = isNaN(wallet?.ngnIn) ? 0 : Number(wallet?.ngnIn)
  const ngnOut = isNaN(wallet?.ngnOut) ? 0 : Number(wallet?.ngnOut)

  return { usdBal, ngnBal: ngnIn - ngnOut }
}

const subscribePlan = async (planEndingTime, freeDomainNamesAvailableFor, planOf, chatId, plan, bot, keyboard) => {
  set(planOf, chatId, plan)
  set(planEndingTime, chatId, Date.now() + timeOf[plan])
  set(freeDomainNamesAvailableFor, chatId, freeDomainsOf[plan])
  bot.sendMessage(chatId, t.planSubscribed.replace('{{plan}}', plan), keyboard)
  log('reply:\t' + t.planSubscribed.replace('{{plan}}', plan) + '\tto: ' + chatId)
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

const parse = (cc, s) => parseInt(s.replace(`+${cc}`, ``).replace(/[^\d]/g, ''), 10).toString()
const getInt = str => {
  const match = str.match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}
// const phoneLen = {
//   1: 11,
//   64: 11,
//   61: 11,
//   44: 12,
// }

// const areaCodeLength = {
//   1: 3,
//   44: 2,
//   64: 2,
//   61: 1,
// }

function extractPhoneNumbers(text, cc) {
  const phoneRegex = /\b(?:\+?\d{1,4}[ -]?)?(?:\(\d{1,}\)[ -]?)?\d{1,}[- ]?\d{1,}[- ]?\d{1,}\b/g
  let phones = text.match(phoneRegex) || []
  phones = phones.map(phoneNumber => phoneNumber.replace(/[\s()-+]/g, ''))
  // phones = phones.filter(phoneNumber => phoneNumber.length === phoneLen[cc])

  const lenBefore = phones.length
  phones = phones.filter(phoneNumber => phoneNumber.startsWith(cc))
  const lenAfter = phones.length

  return { phones, diff: lenBefore - lenAfter }
}

// log(format('1', '4'))
// log(format('1', '20'))
// log(format('1', '200'))
// log(format('1', '201'))
// log(format('1', '213'))

// log(parse('1', '+1(04)'))
// log(parse('1', '+1(20)'))
// log(parse('1', '+1(200)'))
// log(parse('1', '+1(201)'))
// log(parse('1', '+1(213)'))

module.exports = {
  getInt,
  parse,
  year,
  week,
  today,
  month,
  date,
  sleep,
  isAdmin,
  usdToNgn,
  ngnToUsd,
  getRandom,
  isValidUrl,
  sendQrCode,
  getBalance,
  nextNumber,
  isDeveloper,
  isValidEmail,
  isNormalUser,
  subscribePlan,
  regularCheckDns,
  extractPhoneNumbers,
  sendMessageToAllUsers,
}
