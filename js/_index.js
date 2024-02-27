/*global process */
const {
  o,
  t,
  k,
  u,
  bc,
  aO,
  rem,
  dns,
  html,
  user,
  show,
  payIn,
  admin,
  yes_no,
  priceOf,
  payBank,
  linkType,
  tickerOf,
  discountOn,
  planOptions,
  linkOptions,
  tickerViews,
  tickerViewOf,
  dnsRecordType,
  chooseSubscription,
  buyLeadsSelectCountry,
  buyLeadsSelectSmsVoice,
  buyLeadsSelectArea,
  buyLeadsSelectAreaCode,
  buyLeadsSelectCarrier,
  buyLeadsSelectCnam,
  buyLeadsSelectFormat,
  phoneNumberLeads,
  _buyLeadsSelectAreaCode,
  buyLeadsSelectAmount,
  validatorSelectCountry,
  validatorSelectSmsVoice,
  validatorSelectCarrier,
  validatorSelectAmount,
  validatorSelectFormat,
  validatorSelectCnam,
  redSelectRandomCustom,
  redSelectProvider,
  yesNo,
} = require('./config.js')
const createShortBitly = require('./bitly.js')
const createShortUrlCuttly = require('./cuttly.js')
const {
  week,
  year,
  month,
  today,
  isAdmin,
  usdToNgn,
  ngnToUsd,
  isValidUrl,
  nextNumber,
  getBalance,
  sendQrCode,
  isDeveloper,
  isValidEmail,
  subscribePlan,
  regularCheckDns,
  sendMessageToAllUsers,
  parse,
  extractPhoneNumbers,
  getInt,
} = require('./utils.js')
const fs = require('fs')
require('dotenv').config()
const cors = require('cors')
const axios = require('axios')
const express = require('express')
const { log } = require('console')
const { MongoClient, ServerApiVersion } = require('mongodb');
const { customAlphabet } = require('nanoid')
const TelegramBot = require('node-telegram-bot-api')
const { createCheckout } = require('./pay-fincra.js')
const viewDNSRecords = require('./cr-view-dns-records.js')
const { deleteDNSRecord } = require('./cr-dns-record-del.js')
const { buyDomainOnline } = require('./cr-domain-register.js')
const { saveServerInDomain } = require('./cr-dns-record-add.js')
const { updateDNSRecord } = require('./cr-dns-record-update.js')
const { checkDomainPriceOnline } = require('./cr-domain-price-get.js')
const { saveDomainInServer } = require('./rl-save-domain-in-server.js')
const { get, set, del, increment, getAll, decrement } = require('./db.js')
const { getRegisteredDomainNames } = require('./cr-domain-purchased-get.js')
const { getCryptoDepositAddress, convert } = require('./pay-blockbee.js')
const { validateBulkNumbers } = require('./validatePhoneBulk.js')
const { countryCodeOf, areasOfCountry } = require('./areasOfCountry.js')
const { validatePhoneBulkFile } = require('./validatePhoneBulkFile.js')
const createCustomShortUrlCuttly = require('./customCuttly.js')

process.env['NTBA_FIX_350'] = 1
const DB_NAME = process.env.DB_NAME
const SELF_URL = process.env.SELF_URL
const NOT_TRY_CR = process.env.NOT_TRY_CR
const RATE_LEAD = Number(process.env.RATE_LEAD)
const RATE_CNAM = Number(process.env.RATE_CNAM)
const PRICE_BITLY_LINK = Number(process.env.PRICE_BITLY_LINK)
const RATE_LEAD_VALIDATOR = Number(process.env.RATE_LEAD_VALIDATOR)
const RATE_CNAM_VALIDATOR = Number(process.env.RATE_CNAM_VALIDATOR)
const FREE_LINKS = Number(process.env.FREE_LINKS)
const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_DEV_CHAT_ID = process.env.TELEGRAM_DEV_CHAT_ID
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
const FREE_LINKS_TIME_SECONDS = Number(process.env.FREE_LINKS_TIME_SECONDS) * 1000 // to milliseconds
const TELEGRAM_DOMAINS_SHOW_CHAT_ID = Number(process.env.TELEGRAM_DOMAINS_SHOW_CHAT_ID)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5)

if (!DB_NAME || !RATE_LEAD_VALIDATOR) {
  return log('something missing from env file')
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
log('Bot ran!')

const send = (chatId, message, options) => {
  log('reply: ' + message + ' ' + (options?.reply_markup?.keyboard?.map(i => i) || '') + '\tto: ' + chatId + '\n')
  bot.sendMessage(chatId, message, options).catch(e => log(e.message + ': ' + chatId))
}

// variables to implement core functionality
let state = {},
  walletOf = {},
  linksOf = {},
  expiryOf = {},
  fullUrlOf = {},
  maskOf = {},
  domainsOf = {},
  chatIdBlocked = {},
  planEndingTime = {},
  chatIdOfPayment = {},
  totalShortLinks = {},
  freeShortLinksOf = {},
  freeDomainNamesAvailableFor = {}

// variables to view system information
let nameOf = {},
  planOf = {},
  payments = {},
  clicksOf = {},
  clicksOn = {},
  chatIdOf = {}

// some info to use with bot
let adminDomains = [],
  connect_reseller_working = true

// restoreData(); // can be use when there is no db

let db
const loadData = async () => {
  startServer()
  db = client.db(DB_NAME)

  // variables to implement core functionality
  state = db.collection('state')
  linksOf = db.collection('linksOf')
  walletOf = db.collection('walletOf')
  expiryOf = db.collection('expiryOf')
  maskOf = db.collection('maskOf')
  fullUrlOf = db.collection('fullUrlOf')
  domainsOf = db.collection('domainsOf')
  chatIdBlocked = db.collection('chatIdBlocked')
  planEndingTime = db.collection('planEndingTime')
  chatIdOfPayment = db.collection('chatIdOfPayment')
  totalShortLinks = db.collection('totalShortLinks')
  freeShortLinksOf = db.collection('freeShortLinksOf')
  freeDomainNamesAvailableFor = db.collection('freeDomainNamesAvailableFor')

  // variables to view system information
  nameOf = db.collection('nameOf')
  planOf = db.collection('planOf')
  payments = db.collection('payments')
  clicksOf = db.collection('clicksOf')
  clicksOn = db.collection('clicksOn')
  chatIdOf = db.collection('chatIdOf')

  log(`DB Connected lala. May peace be with you and Lord's mercy and blessings.`)

  // buyDomainFullProcess(466590684, 'unlock-userid02.com')


  // set(freeShortLinksOf, 6687923716, 20)
  // Bohut zalil karaya is galat line nai : await set(wallet **** 00)
  // {
  // await del(walletOf, 6687923716)
  // await set(walletOf, 5168006768, 'usdIn', 100)
  // await set(walletOf, 5168006768, 'ngnIn', 100000)
  // const w = await get(walletOf, 5168006768)
  // log({ w })
  // }
  // {
  //   await del(walletOf, 5590563715)
  //   await set(walletOf, 5590563715, 'usdIn', 100)
  //   await set(walletOf, 5590563715, 'ngnIn', 100000)
  //   const w = await get(walletOf, 5590563715)
  //   log({ w })
  // }

  // 5590563715, 5168006768 chat id client
  // 6687923716 chat id testing
  // set(walletOf, 6687923716, { usdIn: 100, ngnIn: 100000 })
  // set(planEndingTime, 6687923716, 0)
  // set(freeShortLinksOf, 6687923716, FREE_LINKS)
  // adminDomains = await getPurchasedDomains(TELEGRAM_DOMAINS_SHOW_CHAT_ID)
}

const client = new MongoClient(process.env.MONGO_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})
client
  .connect()
  .then(loadData)
  .catch(err => log('DB Error bro', err, err?.message))

bot.on('message', async msg => {
  const chatId = msg?.chat?.id
  const message = msg?.text || ''
  log('message: ' + message + '\tfrom: ' + chatId + ' ' + msg?.from?.username)
  NOT_TRY_CR === undefined && tryConnectReseller() // our ip may change on railway hosting so make sure its correct

  if (!db) return send(chatId, 'Bot is starting, please wait')
  if (!connect_reseller_working) {
    await tryConnectReseller()
    if (!connect_reseller_working) return send(chatId, 'Bot starting, please wait')
  }

  const nameOfChatId = await get(nameOf, chatId)
  const username = nameOfChatId || msg?.from?.username || nanoid()

  const blocked = await get(chatIdBlocked, chatId)
  if (blocked) return send(chatId, t.blockedUser, rem)

  if (!nameOfChatId) {
    set(nameOf, chatId, username)
    set(chatIdOf, username, chatId)
  }

  const freeLinks = await get(freeShortLinksOf, chatId)
  if (freeLinks === null || freeLinks === undefined) {
    set(freeShortLinksOf, chatId, FREE_LINKS)
  }

  let info = await get(state, chatId)
  const saveInfo = async (label, data) => {
    await set(state, chatId, label, data)
    info = await get(state, chatId)
  }
  const action = info?.action

  // actions
  const a = {
    // submenu
    submenu1: 'submenu1',
    submenu2: 'submenu2',

    askDomainToUseWithShortener: 'askDomainToUseWithShortener',

    selectCurrencyToWithdraw: 'selectCurrencyToWithdraw',

    selectCurrencyToDeposit: 'selectCurrencyToDeposit',

    depositNGN: 'depositNGN',
    askEmailForNGN: 'askEmailForNGN',
    showDepositNgnInfo: 'showDepositNgnInfo',

    depositUSD: 'depositUSD',
    selectCryptoToDeposit: 'selectCryptoToDeposit',
    showDepositCryptoInfo: 'showDepositCryptoInfo',

    walletSelectCurrency: 'walletSelectCurrency',
    walletSelectCurrencyConfirm: 'walletSelectCurrencyConfirm',

    walletPayUsd: 'walletPayUsd',
    walletPayNgn: 'walletPayNgn',

    askCoupon: 'askCoupon',

    phoneNumberLeads: 'phoneNumberLeads',

    // buyLeads
    buyLeadsSelectCountry: 'buyLeadsSelectCountry',
    buyLeadsSelectSmsVoice: 'buyLeadsSelectSmsVoice',
    buyLeadsSelectArea: 'buyLeadsSelectArea',
    buyLeadsSelectAreaCode: 'buyLeadsSelectAreaCode',
    buyLeadsSelectCarrier: 'buyLeadsSelectCarrier',
    buyLeadsSelectCnam: 'buyLeadsSelectCnam',
    buyLeadsSelectAmount: 'buyLeadsSelectAmount',
    buyLeadsSelectFormat: 'buyLeadsSelectFormat',
    //validatePhoneNumbers
    validatorSelectCountry: 'validatorSelectCountry',
    validatorPhoneNumber: 'validatorPhoneNumber',
    validatorSelectSmsVoice: ' validatorSelectSmsVoice',
    validatorSelectCarrier: 'validatorSelectCarrier',
    validatorSelectCnam: 'validatorSelectCnam',
    validatorSelectAmount: 'validatorSelectAmount',
    validatorSelectFormat: 'validatorSelectFormat',

    // Short link
    redSelectUrl: 'redSelectUrl',
    redSelectRandomCustom: 'redSelectRandomCustom',
    redSelectProvider: 'redSelectProvider',
    redSelectCustomExt: 'redSelectCustomExt',
  }
  const firstSteps = [
    'block-user',
    'unblock-user',
    admin.messageUsers,

    'choose-subscription',
    user.wallet,
    a.phoneNumberLeads,

    a.submenu1,
    a.submenu2,
  ]
  const goto = {
    askCoupon: action => {
      send(chatId, t.askCoupon(info?.price), k.of(['Skip']))
      set(state, chatId, 'action', a.askCoupon + action)
    },
    'domain-pay': () => {
      const { domain, price, couponApplied, newPrice } = info
      couponApplied
        ? send(chatId, t.domainNewPrice(domain, price, newPrice), k.pay)
        : send(chatId, t.domainPrice(domain, price), k.pay)
      set(state, chatId, 'action', 'domain-pay')
    },
    'choose-domain-to-buy': async () => {
      let text = ``
      if (await isSubscribed(chatId)) {
        const plan = await get(planOf, chatId)
        const available = (await get(freeDomainNamesAvailableFor, chatId)) || 0
        const s = available === 1 ? '' : 's'
        text =
          available <= 0
            ? ``
            : ` Remember, your ${plan} plan includes ${available} free ".sbs" domain${s}. Let's get your domain today!`
      }
      set(state, chatId, 'action', 'choose-domain-to-buy')
      send(chatId, t.chooseDomainToBuy(text), bc)
    },
    askDomainToUseWithShortener: () => {
      set(state, chatId, 'action', a.askDomainToUseWithShortener)
      send(chatId, t.askDomainToUseWithShortener, yes_no)
    },
    'plan-pay': () => {
      const { plan, price, couponApplied, newPrice } = info
      couponApplied
        ? send(chatId, t.planNewPrice(plan, price, newPrice), k.pay)
        : send(chatId, t.planPrice(plan, price), k.pay)
      set(state, chatId, 'action', 'plan-pay')
    },
    'choose-subscription': () => {
      set(state, chatId, 'action', 'choose-subscription')
      send(chatId, t.chooseSubscription, chooseSubscription)
    },
    'choose-url-to-shorten': async () => {
      set(state, chatId, 'action', 'choose-url-to-shorten')
      const m = 'Kindly share the URL that you would like shortened and analyzed. e.g https://cnn.com'
      send(chatId, m, bc)
      // adminDomains = await getPurchasedDomains(TELEGRAM_DOMAINS_SHOW_CHAT_ID)
    },
    'choose-domain-with-shorten': domains => {
      send(chatId, t.chooseDomainWithShortener, show(domains))
      set(state, chatId, 'action', 'choose-domain-with-shorten')
    },
    'choose-link-type': () => {
      send(chatId, `Choose link type:`, linkType)
      set(state, chatId, 'action', 'choose-link-type')
    },
    'get-free-domain': () => {
      send(chatId, t.chooseFreeDomainText, yes_no)
      set(state, chatId, 'action', 'get-free-domain')
    },

    'choose-domain-to-manage': async () => {
      const domains = await getPurchasedDomains(chatId)
      set(state, chatId, 'action', 'choose-domain-to-manage')
      send(chatId, t.chooseDomainToManage, show(domains))
    },

    'select-dns-record-id-to-delete': () => {
      send(chatId, t.deleteDnsTxt, bc)
      set(state, chatId, 'action', 'select-dns-record-id-to-delete')
    },

    'confirm-dns-record-id-to-delete': () => {
      send(chatId, t.confirmDeleteDnsTxt, yes_no)
      set(state, chatId, 'action', 'confirm-dns-record-id-to-delete')
    },

    'choose-dns-action': async () => {
      const domain = info?.domainToManage
      const { records, domainNameId } = await viewDNSRecords(domain)

      const toSave = records.map(({ dnszoneID, dnszoneRecordID, recordType, nsId, recordContent }) => ({
        dnszoneID,
        dnszoneRecordID,
        recordType,
        nsId,
        recordContent,
      }))
      const viewDnsRecords = records
        .map(
          ({ recordType, recordContent, nsId }, i) =>
            `${i + 1}.\t${recordType === 'NS' ? recordType + nsId : recordType === 'A' ? 'A Record' : recordType}:\t${recordContent || 'None'
            }`,
        )
        .join('\n')

      set(state, chatId, 'dnsRecords', toSave)
      set(state, chatId, 'domainNameId', domainNameId)
      set(state, chatId, 'action', 'choose-dns-action')
      send(chatId, `${t.viewDnsRecords.replaceAll('{{domain}}', domain)}\n${viewDnsRecords}`, dns)
    },

    'type-dns-record-data-to-add': recordType => {
      send(chatId, t.askDnsContent[recordType], bc)
      set(state, chatId, 'recordType', recordType)
      set(state, chatId, 'action', 'type-dns-record-data-to-add')
    },

    'select-dns-record-id-to-update': () => {
      send(chatId, t.updateDnsTxt, bc)
      set(state, chatId, 'action', 'select-dns-record-id-to-update')
    },
    'type-dns-record-data-to-update': (id, recordType) => {
      set(state, chatId, 'dnsRecordIdToUpdate', id)
      set(state, chatId, 'action', 'type-dns-record-data-to-update')
      send(chatId, t.askUpdateDnsContent[recordType])
    },

    'select-dns-record-type-to-add': () => {
      set(state, chatId, 'action', 'select-dns-record-type-to-add')
      send(chatId, t.addDnsTxt, dnsRecordType)
    },

    //
    //
    [admin.messageUsers]: () => {
      send(chatId, 'Enter message', bc)
      set(state, chatId, 'action', admin.messageUsers)
    },
    adminConfirmMessage: () => {
      send(chatId, 'Confirm?', yes_no)
      set(state, chatId, 'action', 'adminConfirmMessage')
    },
    //
    //
    //

    [user.wallet]: async () => {
      set(state, chatId, 'action', user.wallet)
      const { usdBal, ngnBal } = await getBalance(walletOf, chatId)
      send(chatId, t.wallet(usdBal, ngnBal), k.wallet)
    },
    //
    [a.selectCurrencyToDeposit]: () => {
      set(state, chatId, 'action', a.selectCurrencyToDeposit)
      send(chatId, t.selectCurrencyToDeposit, k.of([u.usd, u.ngn]))
    },
    //
    [a.depositNGN]: () => {
      send(chatId, t.depositNGN, bc)
      set(state, chatId, 'action', a.depositNGN)
    },
    [a.askEmailForNGN]: () => {
      send(chatId, t.askEmailForNGN, bc)
      set(state, chatId, 'action', a.askEmailForNGN)
    },
    showDepositNgnInfo: async () => {
      const ref = nanoid()
      const { depositAmountNgn: ngn, email } = info

      log({ ref })
      set(chatIdOfPayment, ref, { chatId, ngnIn: ngn, endpoint: `/bank-wallet` })
      const { url, error } = await createCheckout(ngn, `/ok?a=b&ref=${ref}&`, email, username, ref)

      set(state, chatId, 'action', 'none')
      if (error) return send(chatId, error, o)
      send(chatId, t.showDepositNgnInfo(ngn), payBank(url))
      return send(chatId, `Bank ₦aira + Card 🌐︎`, o)
    },
    //
    [a.depositUSD]: () => {
      send(chatId, t.depositUSD, bc)
      set(state, chatId, 'action', a.depositUSD)
    },
    [a.selectCryptoToDeposit]: () => {
      set(state, chatId, 'action', a.selectCryptoToDeposit)
      send(chatId, t.selectCryptoToDeposit, k.of(tickerViews))
    },
    showDepositCryptoInfo: async () => {
      const ref = nanoid()
      const { amount, tickerView } = info
      const ticker = tickerOf[tickerView]
      const { address, bb } = await getCryptoDepositAddress(ticker, chatId, SELF_URL, `/crypto-wallet?a=b&ref=${ref}&`)

      log({ ref })
      sendQrCode(bot, chatId, bb)
      set(chatIdOfPayment, ref, { chatId })
      set(state, chatId, 'action', 'none')
      const usdIn = await convert(amount, 'usd', ticker)
      send(chatId, t.showDepositCryptoInfo(usdIn, tickerView, address), o)
    },

    //
    selectCurrencyToWithdraw: () => {
      send(chatId, t.comingSoonWithdraw)
    },
    //
    //
    walletSelectCurrency: async () => {
      if (
        action.includes(a.buyLeadsSelectFormat) ||
        action.includes(a.validatorSelectFormat) ||
        action.includes(a.redSelectRandomCustom)
      ) {
        const { amount, price, couponApplied, newPrice } = info
        couponApplied
          ? send(chatId, t.buyLeadsNewPrice(amount, price, newPrice))
          : send(chatId, t.buyLeadsPrice(amount, price))
      }

      set(state, chatId, 'action', a.walletSelectCurrency)
      const { usdBal, ngnBal } = await getBalance(walletOf, chatId)
      send(chatId, t.walletSelectCurrency(usdBal, ngnBal), k.of([u.usd, u.ngn]))
    },
    walletSelectCurrencyConfirm: async () => {
      const { price, couponApplied, newPrice, coin } = info
      const p = couponApplied ? newPrice : price

      let text = ''
      if (coin === u.ngn) text = t.confirmNgn(p, await usdToNgn(p))

      send(chatId, text + t.walletSelectCurrencyConfirm, yes_no)
      set(state, chatId, 'action', a.walletSelectCurrencyConfirm)
    },
    //
    phoneNumberLeads: () => {
      send(chatId, t.phoneNumberLeads, k.phoneNumberLeads)
      set(state, chatId, 'action', a.phoneNumberLeads)
    },
    //
    //
    // buyLeads
    buyLeadsSelectCountry: () => {
      send(chatId, t.buyLeadsSelectCountry, k.buyLeadsSelectCountry)
      set(state, chatId, 'action', a.buyLeadsSelectCountry)
    },
    buyLeadsSelectSmsVoice: () => {
      send(chatId, t.buyLeadsSelectSmsVoice, k.buyLeadsSelectSmsVoice)
      set(state, chatId, 'action', a.buyLeadsSelectSmsVoice)
    },
    buyLeadsSelectArea: () => {
      send(chatId, t.buyLeadsSelectArea, k.buyLeadsSelectArea(info?.country))
      set(state, chatId, 'action', a.buyLeadsSelectArea)
    },
    buyLeadsSelectAreaCode: () => {
      send(
        chatId,
        t.buyLeadsSelectAreaCode,
        k.buyLeadsSelectAreaCode(info?.country, ['USA', 'Canada'].includes(info?.country) ? info?.area : 'Area Codes'),
      )
      set(state, chatId, 'action', a.buyLeadsSelectAreaCode)
    },
    buyLeadsSelectCarrier: () => {
      send(chatId, t.buyLeadsSelectCarrier, k.buyLeadsSelectCarrier(info?.country))
      set(state, chatId, 'action', a.buyLeadsSelectCarrier)
    },
    buyLeadsSelectCnam: () => {
      send(chatId, t.buyLeadsSelectCnam, k.buyLeadsSelectCnam)
      set(state, chatId, 'action', a.buyLeadsSelectCnam)
    },
    buyLeadsSelectAmount: () => {
      send(
        chatId,
        t.buyLeadsSelectAmount(buyLeadsSelectAmount[0], buyLeadsSelectAmount[buyLeadsSelectAmount.length - 1]),
        k.buyLeadsSelectAmount,
      )
      set(state, chatId, 'action', a.buyLeadsSelectAmount)
    },
    buyLeadsSelectFormat: () => {
      send(chatId, t.buyLeadsSelectFormat, k.buyLeadsSelectFormat)
      set(state, chatId, 'action', a.buyLeadsSelectFormat)
    },

    // validator
    validatorSelectCountry: () => {
      send(chatId, t.validatorSelectCountry, k.validatorSelectCountry)
      set(state, chatId, 'action', a.validatorSelectCountry)
    },

    validatorPhoneNumber: () => {
      send(chatId, t.validatorPhoneNumber, bc)
      set(state, chatId, 'action', a.validatorPhoneNumber)
    },

    validatorSelectSmsVoice: () => {
      send(chatId, t.validatorSelectSmsVoice(info?.phones?.length), k.validatorSelectSmsVoice)
      set(state, chatId, 'action', a.validatorSelectSmsVoice)
    },

    validatorSelectCarrier: () => {
      send(chatId, t.validatorSelectCarrier, k.validatorSelectCarrier(info?.country))
      set(state, chatId, 'action', a.validatorSelectCarrier)
    },

    validatorSelectCnam: () => {
      send(chatId, t.validatorSelectCnam, k.validatorSelectCnam)
      set(state, chatId, 'action', a.validatorSelectCnam)
    },

    validatorSelectAmount: () => {
      send(
        chatId,
        t.validatorSelectAmount(validatorSelectAmount[0], validatorSelectAmount[validatorSelectAmount.length - 1]),
        k.validatorSelectAmount,
      )
      set(state, chatId, 'action', a.validatorSelectAmount)
    },

    validatorSelectFormat: () => {
      send(chatId, t.validatorSelectFormat, k.validatorSelectFormat)
      set(state, chatId, 'action', a.validatorSelectFormat)
    },

    // short link
    redSelectUrl: async () => {
      set(state, chatId, 'action', a.redSelectUrl)
      send(chatId, t.redSelectUrl, bc)
    },

    redSelectRandomCustom: () => {
      send(chatId, t.redSelectRandomCustom, k.redSelectRandomCustom)
      set(state, chatId, 'action', a.redSelectRandomCustom)
    },

    redSelectProvider: () => {
      send(chatId, t.redSelectProvider, k.redSelectProvider)
      set(state, chatId, 'action', a.redSelectProvider)
    },

    redSelectCustomExt: () => {
      send(chatId, t.redSelectCustomExt, bc)
      set(state, chatId, 'action', a.redSelectCustomExt)
    },

    submenu1: () => {
      set(state, chatId, 'action', a.submenu1)
      send(chatId, t.select, k.of([user.redSelectUrl, user.urlShortener, user.viewShortLinks]))
    },
    submenu2: () => {
      set(state, chatId, 'action', a.submenu2)
      send(chatId, t.select, k.of([user.buyDomainName, user.viewDomainNames, user.dnsManagement]))
    },
  }
  const walletOk = {
    'plan-pay': async coin => {
      set(state, chatId, 'action', 'none')

      const plan = info?.plan
      const price = info?.couponApplied ? info?.newPrice : info?.price
      const wallet = await get(walletOf, chatId)
      const { usdBal, ngnBal } = await getBalance(walletOf, chatId)

      if (![u.usd, u.ngn].includes(coin)) return send(chatId, 'Some Issue')

      if (coin === u.usd) {
        const priceUsd = price
        if (usdBal < priceUsd) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))

        const usdOut = (wallet?.usdOut || 0) + priceUsd
        await set(walletOf, chatId, 'usdOut', usdOut)
      } else {
        const priceNgn = await usdToNgn(price)
        if (ngnBal < priceNgn) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))

        const ngnOut = isNaN(wallet?.ngnOut) ? 0 : Number(wallet?.ngnOut)
        await set(walletOf, chatId, 'ngnOut', ngnOut + priceNgn)
      }

      const { usdBal: usd, ngnBal: ngn } = await getBalance(walletOf, chatId)
      send(chatId, t.showWallet(usd, ngn), o)
      subscribePlan(planEndingTime, freeDomainNamesAvailableFor, planOf, chatId, plan, bot)
    },

    'domain-pay': async coin => {
      set(state, chatId, 'action', 'none')
      const price = info?.couponApplied ? info?.newPrice : info?.price
      const wallet = await get(walletOf, chatId)
      const { usdBal, ngnBal } = await getBalance(walletOf, chatId)

      if (![u.usd, u.ngn].includes(coin)) return send(chatId, 'Some Issue')

      // price validate
      const priceUsd = price
      if (coin === u.usd && usdBal < priceUsd) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))
      const priceNgn = await usdToNgn(price)
      if (coin === u.ngn && ngnBal < priceNgn) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))

      // buy domain
      const domain = info?.domain
      const error = await buyDomainFullProcess(chatId, domain)
      if (error) return

      // wallet update
      if (coin === u.usd) {
        const usdOut = (wallet?.usdOut || 0) + priceUsd
        await set(walletOf, chatId, 'usdOut', usdOut)
      }
      if (coin === u.ngn) {
        const ngnOut = isNaN(wallet?.ngnOut) ? 0 : Number(wallet?.ngnOut)
        await set(walletOf, chatId, 'ngnOut', ngnOut + priceNgn)
      }
      const { usdBal: usd, ngnBal: ngn } = await getBalance(walletOf, chatId)
      send(chatId, t.showWallet(usd, ngn), o)
    },
    [a.buyLeadsSelectFormat]: async coin => {
      set(state, chatId, 'action', 'none')
      const price = info?.couponApplied ? info?.newPrice : info?.price
      const wallet = await get(walletOf, chatId)
      const { usdBal, ngnBal } = await getBalance(walletOf, chatId)

      if (![u.usd, u.ngn].includes(coin)) return send(chatId, 'Some Issue')

      // price validate
      const priceUsd = price
      if (coin === u.usd && usdBal < priceUsd) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))
      const priceNgn = await usdToNgn(price)
      if (coin === u.ngn && ngnBal < priceNgn) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))

      let cc = countryCodeOf[info?.country]
      let country = info?.country
      let cnam = info?.country === 'USA' ? info?.cnam : false

      let area = ['USA', 'Canada'].includes(info?.country) ? info?.area : 'Area Codes'
      let areaCodes

      if (['Australia'].includes(info?.country)) {
        areaCodes = ['4']
      } else {
        areaCodes =
          info?.areaCode === 'Mixed Area Codes' ? _buyLeadsSelectAreaCode(info?.country, area) : [info?.areaCode]
      }

      const format = info?.format
      const l = format === buyLeadsSelectFormat[0]

      // buy leads
      send(chatId, t.validateBulkNumbersStart, o)
      const res = await validateBulkNumbers(info?.carrier, info?.amount, cc, areaCodes, cnam, bot, chatId)
      if (!res) return send(chatId, t.buyLeadsError)

      send(chatId, t.buyLeadsSuccess(info?.amount)) // send success message

      cc = '+' + cc
      const re = cc === '+1' ? '' : '0'
      const file1 = 'leads.txt'
      fs.writeFile(file1, res.map(a => (l ? a[0].replace(cc, re) : a[0])).join('\n'), () => {
        bot.sendDocument(chatId, file1)
      })

      if (cnam) {
        const file2 = 'leads_with_cnam.txt'
        fs.writeFile(file2, res.map(a => (l ? a[0].replace(cc, re) : a[0]) + ' ' + a[3]).join('\n'), () => {
          bot.sendDocument(chatId, file2)
          bot.sendDocument(TELEGRAM_ADMIN_CHAT_ID, file2)
        })
      } else {
        if (country !== 'USA') {
          const file2 = 'leads_with_carriers.txt'
          fs.writeFile(file2, res.map(a => (l ? a[0].replace(cc, re) : a[0]) + ' ' + a[1]).join('\n'), () => {
            bot.sendDocument(chatId, file2)
            bot.sendDocument(TELEGRAM_ADMIN_CHAT_ID, file2)
          })
        }
      }

      {
        const file2 = 'leads_with_carriers_and_time.txt'
        chatId === 6687923716 &&
          fs.writeFile(
            file2,
            res.map(a => (l ? a[0].replace(cc, re) : a[0]) + ' ' + a[1] + ' ' + a[2]).join('\n'),
            () => bot.sendDocument(chatId, file2),
          )
      }

      // wallet update
      if (coin === u.usd) {
        const usdOut = (wallet?.usdOut || 0) + priceUsd
        await set(walletOf, chatId, 'usdOut', usdOut)
      } else if (coin === u.ngn) {
        const ngnOut = isNaN(wallet?.ngnOut) ? 0 : Number(wallet?.ngnOut)
        await set(walletOf, chatId, 'ngnOut', ngnOut + priceNgn)
      } else {
        return send(chatId, 'Some Issue')
      }
      const { usdBal: usd, ngnBal: ngn } = await getBalance(walletOf, chatId)
      send(chatId, t.showWallet(usd, ngn), o)
    },

    [a.validatorSelectFormat]: async coin => {
      set(state, chatId, 'action', 'none')
      const price = info?.couponApplied ? info?.newPrice : info?.price
      const wallet = await get(walletOf, chatId)
      const { usdBal, ngnBal } = await getBalance(walletOf, chatId)

      if (![u.usd, u.ngn].includes(coin)) return send(chatId, 'Some Issue')

      // price validate
      const priceUsd = price
      if (coin === u.usd && usdBal < priceUsd) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))
      const priceNgn = await usdToNgn(price)
      if (coin === u.ngn && ngnBal < priceNgn) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))

      let cc = countryCodeOf[info?.country]
      let country = info?.country
      let cnam = info?.country === 'USA' ? info?.cnam : false

      const format = info?.format
      const l = format === validatorSelectFormat[0]

      // buy leads
      send(chatId, t.validatorBulkNumbersStart, o) // main keyboard view
      const phones = info?.phones?.slice(0, info?.amount)
      const res = await validatePhoneBulkFile(info?.carrier, phones, cc, cnam, bot, chatId)
      if (!res) return send(chatId, t.validatorError)

      send(chatId, t.validatorSuccess(info?.amount, res.length)) // send success message

      cc = '+' + cc
      const re = cc === '+1' ? '' : '0'
      const file1 = 'leads.txt'
      fs.writeFile(file1, res.map(a => (l ? a[0].replace(cc, re) : a[0])).join('\n'), () => {
        bot.sendDocument(chatId, file1).catch()
      })

      if (cnam) {
        const file2 = 'leads_with_cnam.txt'
        fs.writeFile(file2, res.map(a => (l ? a[0].replace(cc, re) : a[0]) + ' ' + a[3]).join('\n'), () => {
          bot.sendDocument(chatId, file2).catch()
          bot.sendDocument(TELEGRAM_ADMIN_CHAT_ID, file2).catch()
        })
      } else {
        if (country !== 'USA') {
          const file2 = 'leads_with_carriers.txt'
          fs.writeFile(file2, res.map(a => (l ? a[0].replace(cc, re) : a[0]) + ' ' + a[1]).join('\n'), () => {
            bot.sendDocument(chatId, file2).catch()
            bot.sendDocument(TELEGRAM_ADMIN_CHAT_ID, file2).catch()
          })
        }
      }

      {
        const file2 = 'leads_with_carriers_and_time.txt'
        chatId === 6687923716 &&
          fs.writeFile(
            file2,
            res.map(a => (l ? a[0].replace(cc, re) : a[0]) + ' ' + a[1] + ' ' + a[2]).join('\n'),
            () => bot.sendDocument(chatId, file2).catch(),
          )
      }

      // wallet update
      if (coin === u.usd) {
        const usdOut = (wallet?.usdOut || 0) + priceUsd
        await set(walletOf, chatId, 'usdOut', usdOut)
      } else if (coin === u.ngn) {
        const ngnOut = isNaN(wallet?.ngnOut) ? 0 : Number(wallet?.ngnOut)
        await set(walletOf, chatId, 'ngnOut', ngnOut + priceNgn)
      } else {
        return send(chatId, 'Some Issue')
      }
      const { usdBal: usd, ngnBal: ngn } = await getBalance(walletOf, chatId)
      send(chatId, t.showWallet(usd, ngn), o)
    },
    [a.redSelectProvider]: async coin => {
      set(state, chatId, 'action', 'none')
      const price = info?.couponApplied ? info?.newPrice : info?.price
      const wallet = await get(walletOf, chatId)
      const { usdBal, ngnBal } = await getBalance(walletOf, chatId)

      if (![u.usd, u.ngn].includes(coin)) return send(chatId, 'Some Issue')

      // price validate
      const priceUsd = price
      if (coin === u.usd && usdBal < priceUsd) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))
      const priceNgn = await usdToNgn(price)
      if (coin === u.ngn && ngnBal < priceNgn) return send(chatId, t.walletBalanceLow, k.of([u.deposit]))

      try {
        const { url } = info
        const slug = nanoid()
        const __shortUrl = `${SELF_URL}/${slug}`
        const _shortUrl = await createShortBitly(__shortUrl)
        const shortUrl = __shortUrl.replaceAll('.', '@').replace('https://', '')
        increment(totalShortLinks)
        set(maskOf, shortUrl, _shortUrl)
        set(fullUrlOf, shortUrl, url)
        set(linksOf, chatId, shortUrl, url)
        send(chatId, _shortUrl, o)
        set(state, chatId, 'action', 'none')
      } catch (error) {
        send(TELEGRAM_DEV_CHAT_ID, error.message)
        set(state, chatId, 'action', 'none')
        return send(chatId, t.redIssueUrlBitly, o)
      }

      // wallet update
      if (coin === u.usd) {
        const usdOut = (wallet?.usdOut || 0) + priceUsd
        await set(walletOf, chatId, 'usdOut', usdOut)
      } else if (coin === u.ngn) {
        const ngnOut = isNaN(wallet?.ngnOut) ? 0 : Number(wallet?.ngnOut)
        await set(walletOf, chatId, 'ngnOut', ngnOut + priceNgn)
      } else {
        return send(chatId, 'Some Issue')
      }
      const { usdBal: usd, ngnBal: ngn } = await getBalance(walletOf, chatId)
      send(chatId, t.showWallet(usd, ngn), o)
    },
  }

  const goBack = () => {
    const lastStep = info?.history[info?.history?.length - 1]
    saveInfo('history', info?.history.slice(0, -1)) // rem last elem
    goto[lastStep]()
  }

  if (message === '/start') {
    set(state, chatId, 'action', 'none')

    if (isAdmin(chatId)) return send(chatId, 'Hello, Admin! Please select an option:', aO)

    const freeLinks = await get(freeShortLinksOf, chatId)
    if (freeLinks === undefined || freeLinks > 0) return send(chatId, t.welcomeFreeTrial, o)

    return send(chatId, t.welcome, o)
  }
  //
  if (message.toLowerCase() === 'cancel' || (firstSteps.includes(action) && message === 'Back')) {
    set(state, chatId, 'action', 'none')
    return send(chatId, `User has Pressed ${message} Button.`, isAdmin(chatId) ? aO : o)
  }
  //
  if (message === admin.blockUser) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized')
    set(state, chatId, 'action', 'block-user')
    return send(chatId, t.blockUser, bc)
  }
  if (action === 'block-user') {
    const userToBlock = message
    const chatIdToBlock = await get(chatIdOf, userToBlock)
    if (!chatIdToBlock) return send(chatId, `User ${userToBlock} not found`)

    set(state, chatId, 'action', 'none')
    set(chatIdBlocked, chatIdToBlock, true)
    return send(chatId, `User ${userToBlock} has been blocked.`, aO)
  }
  //
  if (message === admin.unblockUser) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized')
    set(state, chatId, 'action', 'unblock-user')
    return send(chatId, t.unblockUser, bc)
  }
  if (action === 'unblock-user') {
    const userToUnblock = message
    const chatIdToUnblock = await get(chatIdOf, userToUnblock)
    if (!chatIdToUnblock) return send(chatId, `User ${userToUnblock} not found`, bc)

    set(state, chatId, 'action', 'none')
    set(chatIdBlocked, chatIdToUnblock, false)
    return send(chatId, `User ${userToUnblock} has been unblocked.`, aO)
  }
  //
  if (message === admin.messageUsers) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized')
    return goto[admin.messageUsers]()
  }
  if (action === admin.messageUsers) {
    const fileId = msg?.photo?.[0]?.file_id
    set(state, chatId, 'messageContent', fileId || message)
    set(state, chatId, 'messageMethod', fileId ? 'sendPhoto' : 'sendMessage')
    return goto.adminConfirmMessage()
  }
  if (action === 'adminConfirmMessage') {
    if (message === 'Back' || message === 'No') return goto[admin.messageUsers]()
    if (message !== 'Yes') return send(chatId, t.what)

    set(state, chatId, 'action', 'none')
    sendMessageToAllUsers(bot, info?.messageContent, info?.messageMethod, nameOf, chatId)
    return send(chatId, 'Sent to all users', aO)
  }

  // shortURL
  if (message === user.redSelectUrl) {
    return goto.redSelectUrl()
  }

  if (action === a.redSelectUrl) {
    if (message === 'Back') return goto.submenu1()
    if (!isValidUrl(message)) return send(chatId, t.redValidUrl, bc)
    saveInfo('url', message)
    return goto.redSelectProvider()
  }

  if (action === a.redSelectProvider) {
    if (message === 'Back') return goto.redSelectUrl()
    if (message === user.buyPlan) return goto['choose-subscription']()
    if (!redSelectProvider.includes(message)) return send(chatId, t.what)
    saveInfo('provider', message)
    // bitly
    if (message === redSelectProvider[0]) {
      await saveInfo('price', PRICE_BITLY_LINK)
      return goto.askCoupon(a.redSelectProvider)
    }
    // cuttly
    if (redSelectProvider[1] === message) {
      if (!((await freeLinksAvailable(chatId)) || (await isSubscribed(chatId))))
        return send(chatId, '📋 Subscribe first', k.of([...redSelectProvider, user.buyPlan]))
      return goto.redSelectRandomCustom()
    }
  }
  if (action === a.redSelectRandomCustom) {
    if (message === 'Back') return goto.redSelectProvider()

    if (!redSelectRandomCustom.includes(message)) return send(chatId, t.what)
    saveInfo('format', message)

    // random
    if (redSelectRandomCustom[0] === message) {
      try {
        const { url } = info
        const slug = nanoid()
        const __shortUrl = `${SELF_URL}/${slug}`
        const _shortUrl = await createShortUrlCuttly(__shortUrl)
        const shortUrl = __shortUrl.replaceAll('.', '@').replace('https://', '')
        increment(totalShortLinks)
        set(maskOf, shortUrl, _shortUrl)
        set(fullUrlOf, shortUrl, url)
        set(linksOf, chatId, shortUrl, url)
        if (!(await isSubscribed(chatId))) {
          decrement(freeShortLinksOf, chatId)
          set(expiryOf, shortUrl, Date.now() + FREE_LINKS_TIME_SECONDS)
        }
        set(state, chatId, 'action', 'none')
        return send(chatId, _shortUrl, o)
      } catch (error) {
        send(TELEGRAM_ADMIN_CHAT_ID, error?.response?.data)
        set(state, chatId, 'action', 'none')
        return send(chatId, t.redIssueUrlCuttly, o)
      }
    }

    // custom
    if (redSelectRandomCustom[1] === message) return goto.redSelectCustomExt()
  }
  if (action === a.redSelectCustomExt) {
    if (message === 'Back') return goto.redSelectRandomCustom()

    if (!isValidUrl(`https://abc.com/${message}`)) return send(chatId, `Enter a valid back half`)
    try {
      const { url } = info
      const slug = nanoid()
      const __shortUrl = `${SELF_URL}/${slug}`
      const _shortUrl = await createCustomShortUrlCuttly(__shortUrl, message)
      const shortUrl = __shortUrl.replaceAll('.', '@').replace('https://', '')
      increment(totalShortLinks)
      set(maskOf, shortUrl, _shortUrl)
      set(fullUrlOf, shortUrl, url)
      set(linksOf, chatId, shortUrl, url)
      if (!(await isSubscribed(chatId))) {
        decrement(freeShortLinksOf, chatId)
        set(expiryOf, shortUrl, Date.now() + FREE_LINKS_TIME_SECONDS)
      }
      set(state, chatId, 'action', 'none')
      return send(chatId, _shortUrl, o)
    } catch (error) {
      if (error?.response?.data?.url?.status === 3) {
        return send(chatId, t.redIssueSlugCuttly)
      }

      send(
        TELEGRAM_ADMIN_CHAT_ID,
        'cuttly issue: status:' + error?.response?.data?.url?.status + ' ' + error?.response?.data,
      )
      set(state, chatId, 'action', 'none')
      return send(chatId, t.redIssueUrlCuttly, o)
    }
  }

  if (action === a.askCoupon + a.redSelectProvider) {
    if (message === 'Back') return goto.redSelectProvider()
    if (message === 'Skip') {
      saveInfo('lastStep', a.redSelectProvider)
      return (await saveInfo('couponApplied', false)) || goto.walletSelectCurrency()
    }

    const { price } = info
    const coupon = message.toUpperCase()
    const discount = discountOn[coupon]

    if (isNaN(discount)) return send(chatId, t.couponInvalid)

    const newPrice = price - (price * discount) / 100
    send(chatId, t.redNewPrice(price, newPrice), k.pay)
    await saveInfo('newPrice', newPrice)
    await saveInfo('couponApplied', true)
    await saveInfo('lastStep', a.redSelectProvider)

    return goto.walletSelectCurrency()
  }

  if (message === user.urlShortener) {
    if (!((await freeLinksAvailable(chatId)) || (await isSubscribed(chatId)))) return send(chatId, '📋 Subscribe first')

    return goto['choose-url-to-shorten']()
  }
  if (action === 'choose-url-to-shorten') {
    if (message === 'Back') return goto.submenu1()
    if (!isValidUrl(message)) return send(chatId, 'Please provide a valid URL. e.g https://google.com', bc)

    set(state, chatId, 'url', message)

    const domains = await getPurchasedDomains(chatId)
    return goto['choose-domain-with-shorten']([...domains, ...adminDomains])
  }
  if (action === 'choose-domain-with-shorten') {
    if (message === 'Back') return goto['choose-url-to-shorten']()
    if (message === user.buyDomainName) return goto['choose-domain-to-buy']()

    const domain = message.toLowerCase()
    const domains = await getPurchasedDomains(chatId)
    if (!(domains.includes(domain) || adminDomains.includes(domain))) {
      return send(chatId, 'Please choose a valid domain')
    }
    set(state, chatId, 'selectedDomain', message)
    return goto['choose-link-type']()
  }
  if (action === 'choose-link-type') {
    if (message === 'Back') return goto['choose-domain-with-shorten'](await getPurchasedDomains(chatId))

    if (!linkOptions.includes(message)) return send(chatId, t.what)

    if (message === 'Custom Link') {
      set(state, chatId, 'action', 'shorten-custom')
      return send(chatId, `Please tell your us preferred short link extension: e.g payer`, bc)
    }

    // Random Link
    const url = info?.url
    const domain = info?.selectedDomain
    const shortUrl = domain + '/' + nanoid()
    if (await get(fullUrlOf, shortUrl)) {
      send(chatId, `Link already exists. Please type 'ok' to try another.`)
      return
    }

    const shortUrlSanitized = shortUrl.replaceAll('.', '@')
    increment(totalShortLinks)
    set(state, chatId, 'action', 'none')
    set(fullUrlOf, shortUrlSanitized, url)
    set(linksOf, chatId, shortUrlSanitized, url)
    send(chatId, `Your shortened URL is: ${shortUrl}`, o)
    if (adminDomains.includes(domain)) {
      decrement(freeShortLinksOf, chatId)
      set(expiryOf, shortUrlSanitized, Date.now() + FREE_LINKS_TIME_SECONDS)
    }
    return
  }
  if (action === 'shorten-custom') {
    if (message === 'Back') return goto['choose-link-type']()

    const url = info?.url
    const domain = info?.selectedDomain
    const shortUrl = domain + '/' + message

    if (!isValidUrl('https://' + shortUrl)) return send(chatId, t.provideLink)
    if (await get(fullUrlOf, shortUrl)) return send(chatId, `Link already exists. Please try another.`)

    const shortUrlSanitized = shortUrl.replaceAll('.', '@')
    increment(totalShortLinks)
    set(state, chatId, 'action', 'none')
    set(fullUrlOf, shortUrlSanitized, url)
    set(linksOf, chatId, shortUrlSanitized, url)
    send(chatId, `Your shortened URL is: ${shortUrl}`, o)
    if (adminDomains.includes(domain)) {
      decrement(freeShortLinksOf, chatId)
      set(expiryOf, shortUrlSanitized, Date.now() + FREE_LINKS_TIME_SECONDS)
    }
    return
  }
  //
  //
  if (message === user.buyDomainName) {
    return goto['choose-domain-to-buy']()
  }
  if (action === 'choose-domain-to-buy') {
    if (message === 'Back') return goto.submenu2()
    let domain = message.toLowerCase()
    domain = domain.replace('https://', '')
    domain = domain.replace('http://', '')

    const domainRegex = /^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/
    if (!domainRegex.test(domain))
      return send(chatId, 'Domain name is invalid. Please try another domain name. Use format abcpay.com')
    const { available, price, originalPrice } = await checkDomainPriceOnline(domain)
    if (!originalPrice) {
      send(TELEGRAM_DEV_CHAT_ID, 'Some issue in getting price', rem)
      return send(chatId, 'Some issue in getting price', rem)
    }
    if (!available) return send(chatId, 'Domain is not available. Please try another domain name.', rem)
    saveInfo('price', price)
    saveInfo('domain', domain)
    saveInfo('originalPrice', originalPrice)
    return goto.askDomainToUseWithShortener()
  }
  if (action === a.askDomainToUseWithShortener) {
    if (message === 'Back') return goto['choose-domain-to-buy']()
    if (!yesNo.includes(message)) return send(chatId, t.what)
    saveInfo('askDomainToUseWithShortener', message)

    if (info?.originalPrice <= 2 && (await isSubscribed(chatId))) {
      const available = (await get(freeDomainNamesAvailableFor, chatId)) || 0
      if (available > 0) return goto['get-free-domain']()
    }

    return goto.askCoupon('choose-domain-to-buy')
  }
  if (action === a.askCoupon + 'choose-domain-to-buy') {
    if (message === 'Back') return goto.askDomainToUseWithShortener()
    if (message === 'Skip') return (await saveInfo('couponApplied', false)) || goto['domain-pay']()

    const { price } = info

    const coupon = message.toUpperCase()
    const discount = discountOn[coupon]
    if (isNaN(discount)) return send(chatId, t.couponInvalid)

    const newPrice = price - (price * discount) / 100
    await saveInfo('newPrice', newPrice)
    await saveInfo('couponApplied', true)

    return goto['domain-pay']()
  }
  if (action === 'domain-pay') {
    if (message === 'Back') return goto.askCoupon('choose-domain-to-buy')
    const payOption = message

    if (payOption === payIn.crypto) {
      set(state, chatId, 'action', 'crypto-pay-domain')
      return send(chatId, `Please choose a crypto currency`, k.of(tickerViews))
    }

    if (payOption === payIn.bank) {
      set(state, chatId, 'action', 'bank-pay-domain')
      return send(chatId, t.askEmail, bc)
    }

    if (payOption === payIn.wallet) {
      set(state, chatId, 'lastStep', 'domain-pay')
      return goto.walletSelectCurrency()
    }

    return send(chatId, t.askValidPayOption)
  }
  if (action === 'bank-pay-domain') {
    if (message === 'Back') return goto['domain-pay']()
    const email = message
    const price = info?.price
    const domain = info?.domain
    if (!isValidEmail(email)) return send(chatId, t.askValidEmail)

    const ref = nanoid()

    log({ ref })
    set(state, chatId, 'action', 'none')
    const priceNGN = Number(await usdToNgn(price))
    set(chatIdOfPayment, ref, { chatId, price, domain, endpoint: `/bank-pay-domain` })
    const { url, error } = await createCheckout(priceNGN, `/ok?a=b&ref=${ref}&`, email, username, ref)
    if (error) return send(chatId, error, o)
    send(chatId, `Bank ₦aira + Card 🌐︎`, o)
    return send(chatId, t.bankPayDomain(priceNGN, domain), payBank(url))
  }
  if (action === 'crypto-pay-domain') {
    if (message === 'Back') return goto['domain-pay']()
    const tickerView = message
    const coin = tickerOf[tickerView]
    const price = info?.price
    const domain = info?.domain
    if (!coin) return send(chatId, t.askValidCrypto)

    const ref = nanoid()
    set(chatIdOfPayment, ref, { chatId, price, domain })
    const { address, bb } = await getCryptoDepositAddress(coin, chatId, SELF_URL, `/crypto-pay-domain?a=b&ref=${ref}&`)

    log({ ref })
    sendQrCode(bot, chatId, bb)
    set(state, chatId, 'action', 'none')
    const priceCrypto = await convert(price, 'usd', coin)
    return send(chatId, t.showDepositCryptoInfoDomain(priceCrypto, tickerView, address, domain), o)
  }
  if (action === 'get-free-domain') {
    if (message === 'Back' || message === 'No') return goto['choose-domain-to-buy']()
    if (message !== 'Yes') return send(chatId, t.what)

    const domain = info?.domain
    const error = await buyDomainFullProcess(chatId, domain)
    if (!error) decrement(freeDomainNamesAvailableFor, chatId)

    return set(state, chatId, 'action', 'none')
  }
  //
  //
  if (message === user.buyPlan) {
    if (await isSubscribed(chatId)) return send(chatId, 'You are currently enrolled in a subscription plan.')
    return goto['choose-subscription']()
  }
  if (action === 'choose-subscription') {
    const plan = message
    if (!planOptions.includes(plan)) return send(chatId, 'Please choose a valid plan', chooseSubscription)
    await saveInfo('plan', plan)
    await saveInfo('price', priceOf[plan])
    return goto.askCoupon('choose-subscription')
  }
  if (action === a.askCoupon + 'choose-subscription') {
    if (message === 'Back') return goto['choose-subscription']()
    const price = priceOf[info?.plan]
    saveInfo('price', price)
    if (message === 'Skip') return (await saveInfo('couponApplied', false)) || goto['plan-pay']()

    const coupon = message.toUpperCase()
    const discount = discountOn[coupon]
    if (isNaN(discount)) return send(chatId, t.couponInvalid)

    const newPrice = price - (price * discount) / 100
    await saveInfo('newPrice', newPrice)
    await saveInfo('couponApplied', true)

    return goto['plan-pay']()
  }
  if (action === 'plan-pay') {
    if (message === 'Back') return goto.askCoupon('choose-subscription')
    const payOption = message
    if (payOption === payIn.crypto) {
      set(state, chatId, 'action', 'crypto-pay-plan')
      return send(chatId, `Please choose a crypto currency`, k.of(tickerViews))
    }
    if (payOption === payIn.bank) {
      set(state, chatId, 'action', 'bank-pay-plan')
      return send(chatId, t.askEmail, bc)
    }
    if (payOption === payIn.wallet) {
      set(state, chatId, 'lastStep', 'plan-pay')
      return goto.walletSelectCurrency()
    }
    return send(chatId, t.askValidPayOption)
  }
  if (action === 'bank-pay-plan') {
    if (message === 'Back') return goto['plan-pay']()

    const email = message
    if (!isValidEmail(email)) return send(chatId, t.askValidEmail)

    const { plan, price } = info
    const priceNGN = Number(await usdToNgn(price))

    const ref = nanoid()
    set(state, chatId, 'action', 'none')
    set(chatIdOfPayment, ref, { chatId, price, plan, endpoint: `/bank-pay-plan` })
    const { url, error } = await createCheckout(priceNGN, `/ok?a=b&ref=${ref}&`, email, username, ref)

    log({ ref })
    if (error) return send(chatId, error, o)
    send(chatId, `Bank ₦aira + Card 🌐︎`, o)
    return send(chatId, t['bank-pay-plan'](priceNGN, plan), payBank(url))
  }
  if (action === 'crypto-pay-plan') {
    if (message === 'Back') return goto['plan-pay']()

    const ref = nanoid()
    const tickerView = message
    const ticker = tickerOf[tickerView]
    if (!ticker) return send(chatId, t.askValidCrypto)
    const { address, bb } = await getCryptoDepositAddress(ticker, chatId, SELF_URL, `/crypto-pay-plan?a=b&ref=${ref}&`)

    log({ ref })
    sendQrCode(bot, chatId, bb)
    const { plan, price } = info
    set(state, chatId, 'action', 'none')
    set(chatIdOfPayment, ref, { chatId, price, plan })
    const priceCrypto = await convert(price, 'usd', ticker)
    return send(chatId, t.showDepositCryptoInfoPlan(priceCrypto, tickerView, address, plan), o)
  }
  //
  //
  if (message === user.dnsManagement) {
    if (!(await ownsDomainName(chatId))) {
      send(chatId, 'No domain names found')
      return
    }

    return goto['choose-domain-to-manage']()
  }
  if (action === 'choose-domain-to-manage') {
    if (message === 'Back') return goto.submenu2()
    const domain = message.toLowerCase()

    // if he not owns that domain then return
    const domains = await getPurchasedDomains(chatId)
    if (!domains.includes(domain)) {
      return send(chatId, 'Please choose a valid domain')
    }

    await set(state, chatId, 'domainToManage', domain)
    info = await get(state, chatId)

    return goto['choose-dns-action']()
  }
  if (action === 'choose-dns-action') {
    if (message === 'Back') return goto['choose-domain-to-manage']()

    if (![t.addDns, t.updateDns, t.deleteDns].includes(message)) return send(chatId, `select valid option`)

    if (message === t.deleteDns) return goto['select-dns-record-id-to-delete']()

    if (message === t.updateDns) return goto['select-dns-record-id-to-update']()

    if (message === t.addDns) return goto['select-dns-record-type-to-add']()
  }
  //
  if (action === 'select-dns-record-id-to-delete') {
    if (message === 'Back') return goto['choose-dns-action']()

    let id = Number(message)
    if (isNaN(id) || !(id > 0 && id <= info?.dnsRecords.length)) return send(chatId, `select valid option`)

    set(state, chatId, 'delId', --id) // User See id as 1,2,3 and we see as 0,1,2
    return goto['confirm-dns-record-id-to-delete']()
  }
  if (action === 'confirm-dns-record-id-to-delete') {
    if (message === 'Back' || message === 'No') return goto['select-dns-record-id-to-delete']()
    if (message !== 'Yes') return send(chatId, t.what)

    const { domainNameId, dnsRecords, domainToManage, delId } = info
    const nsRecords = dnsRecords.filter(r => r.recordType === 'NS')
    const { dnszoneID, dnszoneRecordID, nsId } = dnsRecords[delId]
    const { error } = await deleteDNSRecord(dnszoneID, dnszoneRecordID, domainToManage, domainNameId, nsId, nsRecords)
    if (error) return send(chatId, `Error deleting dns record, ${error}, Provide value again`)

    send(chatId, t.dnsRecordDeleted)
    return goto['choose-dns-action']()
  }
  if (action === 'select-dns-record-type-to-add') {
    if (message === 'Back') return goto['choose-dns-action']()

    const recordType = message

    if (![t.cname, t.ns, t.a].includes(recordType)) {
      return send(chatId, `select valid option`)
    }

    return goto['type-dns-record-data-to-add'](recordType)
  }
  if (action === 'type-dns-record-data-to-add') {
    if (message === 'Back') return goto['select-dns-record-type-to-add']()

    const domain = info?.domainToManage
    const recordType = info?.recordType
    const recordContent = message
    const dnsRecords = info?.dnsRecords
    const nsRecords = dnsRecords?.filter(r => r.recordType === 'NS')
    const domainNameId = info?.domainNameId

    if (nsRecords.length >= 4 && t[recordType] === 'NS') {
      send(chatId, 'Maximum 4 NS records can be added, you can update or delete previous NS records')
      return goto['choose-dns-action']()
    }

    const nextId = nextNumber(nsRecords.map(r => r.nsId))
    const { error } = await saveServerInDomain(domain, recordContent, t[recordType], domainNameId, nextId, nsRecords)
    if (error) {
      const m = `Error saving dns record, ${error}, Provide value again`
      return send(chatId, m)
    }

    send(chatId, t.dnsRecordSaved)
    return goto['choose-dns-action']()
  }
  //
  if (action === 'select-dns-record-id-to-update') {
    if (message === 'Back') return goto['choose-dns-action']()

    const dnsRecords = info?.dnsRecords
    let id = Number(message)
    if (isNaN(id) || !(id > 0 && id <= dnsRecords.length)) {
      return send(chatId, `select valid option`)
    }
    id-- // User See id as 1,2,3 and we see as 0,1,2

    return goto['type-dns-record-data-to-update'](id, dnsRecords[id]?.recordType)
  }
  if (action === 'type-dns-record-data-to-update') {
    if (message === 'Back') return goto['select-dns-record-id-to-update']()

    const recordContent = message
    const dnsRecords = info?.dnsRecords
    const domainNameId = info?.domainNameId
    const domain = info?.domainToManage
    const id = info?.dnsRecordIdToUpdate

    const { dnszoneID, dnszoneRecordID, recordType, nsId } = dnsRecords[id]
    const { error } = await updateDNSRecord(
      dnszoneID,
      dnszoneRecordID,
      domain,
      recordType,
      recordContent,
      domainNameId,
      nsId,
      dnsRecords.filter(r => r.recordType === 'NS'),
    )
    if (error) {
      const m = `Error update dns record, ${error}, Provide value again`
      send(chatId, m)
      return m
    }

    send(chatId, t.dnsRecordUpdated)
    return goto['choose-dns-action']()
  }
  //
  //
  //
  if (message === user.wallet) {
    return goto[user.wallet]()
  }
  if (action === user.wallet) {
    if (message === u.deposit) return goto[a.selectCurrencyToDeposit]() // can be combine in one line with object
    if (message === u.withdraw) return goto[a.selectCurrencyToWithdraw]()
    return send(chatId, t.what)
  }

  if (message === u.deposit) return goto[a.selectCurrencyToDeposit]()

  if (action === a.selectCurrencyToDeposit) {
    if (message === 'Back') return goto[user.wallet]()
    if (message === u.usd) return goto[a.depositUSD]()
    if (message === u.ngn) return goto[a.depositNGN]()
    return send(chatId, t.what)
  }

  if (action === a.depositNGN) {
    if (message === 'Back') return goto[a.selectCurrencyToDeposit]()

    const amount = message
    if (isNaN(amount)) return send(chatId, t.askValidAmount)
    await saveInfo('depositAmountNgn', Number(amount))
    return goto[a.askEmailForNGN]()
  }
  if (action === a.askEmailForNGN) {
    if (message === 'Back') return goto[a.depositNGN]()

    const email = message
    if (!isValidEmail(email)) return send(chatId, t.askValidEmail)
    await saveInfo('email', email)
    return goto.showDepositNgnInfo()
  }

  if (action === a.depositUSD) {
    if (message === 'Back') return goto[a.selectCurrencyToDeposit]()

    const amount = Number(message)
    if (isNaN(amount)) return send(chatId, t.whatNum)
    await saveInfo('amount', amount)

    return goto[a.selectCryptoToDeposit]()
  }
  if (action === a.selectCryptoToDeposit) {
    if (message === 'Back') return goto[a.depositUSD]()

    const tickerView = message
    const ticker = tickerOf[tickerView]
    if (!ticker) return send(chatId, t.askValidCrypto)
    await saveInfo('tickerView', tickerView)
    return goto.showDepositCryptoInfo()
  }
  //
  //
  if (action === a.walletSelectCurrency) {
    if (message === 'Back') return goto[info?.lastStep]()

    const coin = message
    if (![u.usd, u.ngn].includes(coin)) return send(chatId, t.what)
    await saveInfo('coin', coin)

    return goto.walletSelectCurrencyConfirm()
  }
  if (action === a.walletSelectCurrencyConfirm) {
    if (message === 'Back' || message === 'No') return goto[a.walletSelectCurrency]()

    if (message !== 'Yes') return send(chatId, t.what)
    return walletOk[info?.lastStep](info?.coin)
  }

  //
  //
  if (message === user.urlShortenerMain) {
    return goto.submenu1()
  }
  if (message === user.domainNames) {
    return goto.submenu2()
  }
  if (message === user.phoneNumberLeads) {
    return goto.phoneNumberLeads()
  }
  if (action === a.phoneNumberLeads) {
    if (phoneNumberLeads[1] === message) return goto.validatorSelectCountry()
    if (phoneNumberLeads[0] === message) return goto.buyLeadsSelectCountry()

    return send(chatId, t.what)
  }
  if (action === a.buyLeadsSelectCountry) {
    if (message === 'Back') goto.phoneNumberLeads()
    if (!buyLeadsSelectCountry.includes(message)) return send(chatId, t.what)
    if (areasOfCountry[message] && Object.keys(areasOfCountry[message]).length === 0) return send(chatId, `Coming Soon`)
    saveInfo('country', message)
    return goto.buyLeadsSelectSmsVoice()
  }
  if (action === a.buyLeadsSelectSmsVoice) {
    if (message === 'Back') return goto.buyLeadsSelectCountry()
    if (buyLeadsSelectSmsVoice[1] === message) return send(chatId, `Coming Soon`)
    if (!buyLeadsSelectSmsVoice.includes(message)) return send(chatId, t.what)
    saveInfo('smsVoice', message)
    saveInfo('cameFrom', a.buyLeadsSelectSmsVoice)
    if (['Australia'].includes(info?.country)) return goto.buyLeadsSelectCarrier()
    if (['USA', 'Canada'].includes(info?.country)) return goto.buyLeadsSelectArea()
    return goto.buyLeadsSelectAreaCode()
  }
  if (action === a.buyLeadsSelectArea) {
    if (message === 'Back') return goto.buyLeadsSelectSmsVoice()
    if (!buyLeadsSelectArea(info?.country).includes(message)) return send(chatId, t.what)
    await saveInfo('area', message)
    saveInfo('cameFrom', a.buyLeadsSelectArea)
    return goto.buyLeadsSelectAreaCode()
  }
  if (action === a.buyLeadsSelectAreaCode) {
    if (message === 'Back') return goto?.[info?.cameFrom]()
    const areaCodes = buyLeadsSelectAreaCode(
      info?.country,
      ['USA', 'Canada'].includes(info?.country) ? info?.area : 'Area Codes',
    )
    if (!areaCodes.includes(message)) return send(chatId, t.what)

    let cc = countryCodeOf[info?.country]
    saveInfo('areaCode', message === 'Mixed Area Codes' ? message : parse(cc, message))

    return goto.buyLeadsSelectCarrier()
  }
  if (action === a.buyLeadsSelectCarrier) {
    if (message === 'Back') return goto?.[info?.cameFrom]()
    if (!buyLeadsSelectCarrier(info?.country).includes(message)) return send(chatId, t.what)
    saveInfo('carrier', message)
    saveInfo('cameFrom', a.buyLeadsSelectCarrier)
    if (['USA'].includes(info?.country)) return goto.buyLeadsSelectCnam()
    return goto.buyLeadsSelectAmount()
  }
  if (action === a.buyLeadsSelectCnam) {
    if (message === 'Back') return goto.buyLeadsSelectCarrier()
    if (!buyLeadsSelectCnam.includes(message)) return send(chatId, t.what)
    saveInfo('cnam', message === 'Yes')
    saveInfo('cameFrom', a.buyLeadsSelectCnam)
    return goto.buyLeadsSelectAmount()
  }
  if (action === a.buyLeadsSelectAmount) {
    if (message === 'Back') return goto?.[info?.cameFrom]()

    const amount = Number(message)
    if (chatId === 6687923716) {
      if (isNaN(amount)) return send(chatId, t.whatNum)
    } else if (
      isNaN(amount) ||
      amount < Number(buyLeadsSelectAmount[0]) ||
      amount > Number(buyLeadsSelectAmount[buyLeadsSelectAmount.length - 1])
    )
      return send(chatId, t.whatNum)

    saveInfo('amount', amount)
    let cnam = info?.country === 'USA' ? info?.cnam : false
    const price = amount * RATE_LEAD + (cnam ? amount * RATE_CNAM : 0)
    saveInfo('price', price)
    return goto.buyLeadsSelectFormat()
  }
  if (action === a.buyLeadsSelectFormat) {
    if (message === 'Back') return goto.buyLeadsSelectAmount()
    if (!buyLeadsSelectFormat.includes(message)) return send(chatId, t.what)
    saveInfo('format', message)
    return goto.askCoupon(a.buyLeadsSelectFormat)
  }
  if (action === a.askCoupon + a.buyLeadsSelectFormat) {
    if (message === 'Back') return goto.buyLeadsSelectFormat()
    if (message === 'Skip') {
      saveInfo('lastStep', a.buyLeadsSelectFormat)
      return (await saveInfo('couponApplied', false)) || goto.walletSelectCurrency()
    }

    const { price } = info

    const coupon = message.toUpperCase()
    const discount = discountOn[coupon]
    if (isNaN(discount)) return send(chatId, t.couponInvalid)

    const newPrice = price - (price * discount) / 100
    await saveInfo('newPrice', newPrice)
    await saveInfo('couponApplied', true)

    await saveInfo('lastStep', a.buyLeadsSelectFormat)

    return goto.walletSelectCurrency()
  }

  //phone number validator
  if (action === a.validatorSelectCountry) {
    if (message === 'Back') return goto.phoneNumberLeads()
    if (!validatorSelectCountry.includes(message)) return send(chatId, t.what)
    saveInfo('country', message)
    return goto.validatorPhoneNumber()
  }

  // get phone on file
  if (action === a.validatorPhoneNumber) {
    if (message === 'Back') return goto.validatorSelectCountry()

    let content

    if (msg.document) {
      try {
        const fileLink = await bot.getFileLink(msg.document.file_id)
        content = (await axios.get(fileLink, { responseType: 'text' }))?.data
      } catch (error) {
        console.error('Error:', error.message)
        return send(chatId, 'Error occurred while processing the file.')
      }
    } else {
      content = message
    }

    let cc = countryCodeOf[info?.country]
    const { phones, diff } = extractPhoneNumbers(content, cc)
    if (phones < diff) return send(chatId, t.validatorErrorFileData) // good phones are less than bad ones
    if (phones.length === 0) return send(chatId, t.validatorErrorNoPhonesFound)
    await saveInfo('phones', phones)
    saveInfo('amount', phones.length)

    return goto.validatorSelectSmsVoice()
  }

  if (action === a.validatorSelectSmsVoice) {
    if (message === 'Back') return goto.validatorPhoneNumber()
    if (validatorSelectSmsVoice[1] === message) return send(chatId, `Coming Soon`)
    if (!validatorSelectSmsVoice.includes(message)) return send(chatId, t.what)
    saveInfo('smsVoice', message)
    return goto.validatorSelectCarrier() //////
  }

  if (action === a.validatorSelectCarrier) {
    if (message === 'Back') return goto.validatorSelectSmsVoice()
    if (!validatorSelectCarrier(info?.country).includes(message)) return send(chatId, t.what)
    saveInfo('carrier', message)
    saveInfo('history', [...(info?.history || []), a.validatorSelectCarrier])
    if (!['USA'].includes(info?.country) && info?.phones.length < 2000) {
      return goto.validatorSelectFormat()
    }
    if (!['USA'].includes(info?.country)) return goto.validatorSelectAmount()
    return goto.validatorSelectCnam()
  }
  if (action === a.validatorSelectCnam) {
    if (message === 'Back') return goBack()
    if (!validatorSelectCnam.includes(message)) return send(chatId, t.what)
    saveInfo('cnam', message === 'Yes')
    saveInfo('history', [...(info?.history || []), a.validatorSelectCnam])

    if (info?.phones.length < 2000) {
      let cnam = info?.country === 'USA' ? info?.cnam : false
      const price = info?.amount * RATE_LEAD_VALIDATOR + (cnam ? info?.amount * RATE_CNAM_VALIDATOR : 0)
      saveInfo('price', price)

      return goto.validatorSelectFormat()
    }

    return goto.validatorSelectAmount()
  }

  if (action === a.validatorSelectAmount) {
    if (message === 'Back') return goBack()
    let amount = message
    if (message.toLowerCase() === 'all') {
      amount = info?.phones.length
    }
    if (isNaN(amount)) return send(chatId, `Amount incorrect`)
    saveInfo('amount', Number(amount))
    saveInfo('history', [...(info?.history || []), a.validatorSelectAmount])
    let cnam = info?.country === 'USA' ? info?.cnam : false
    const price = amount * RATE_LEAD_VALIDATOR + (cnam ? amount * RATE_CNAM_VALIDATOR : 0)
    saveInfo('price', price)
    return goto.validatorSelectFormat()
  }
  if (action === a.validatorSelectFormat) {
    if (message === 'Back') return goBack()
    if (!validatorSelectFormat.includes(message)) return send(chatId, t.what)
    saveInfo('format', message)
    return goto.askCoupon(a.validatorSelectFormat)
  }
  if (action === a.askCoupon + a.validatorSelectFormat) {
    if (message === 'Back') return goto.validatorSelectFormat()
    if (message === 'Skip') {
      saveInfo('lastStep', a.validatorSelectFormat)
      return (await saveInfo('couponApplied', false)) || goto.walletSelectCurrency()
    }

    const { price } = info

    const coupon = message.toUpperCase()
    const discount = discountOn[coupon]
    if (isNaN(discount)) return send(chatId, t.couponInvalid)

    const newPrice = price - (price * discount) / 100
    await saveInfo('newPrice', newPrice)
    await saveInfo('couponApplied', true)

    await saveInfo('lastStep', a.validatorSelectFormat)

    return goto.walletSelectCurrency()
  }

  if (message === user.joinChannel) {
    return send(chatId, t.joinChannel)
  }

  if (message === user.viewPlan) {
    const subscribedPlan = await get(planOf, chatId)

    if (subscribedPlan) {
      if (!(await isSubscribed(chatId))) {
        send(chatId, `Your ${subscribedPlan} subscription is expired on ${new Date(await get(planEndingTime, chatId))}`)
        return
      }

      send(
        chatId,
        `You are currently subscribed to the ${subscribedPlan} plan. Your plan is valid till ${new Date(
          await get(planEndingTime, chatId),
        )}`,
      )
      return
    }

    send(chatId, 'You are not currently subscribed to any plan.')
    return
  }
  if (message === user.viewShortLinks) {
    const links = await getShortLinks(chatId)
    if (links.length === 0) {
      send(chatId, 'You have no shortened links yet.')
      return
    }

    const linksText = formatLinks(links.slice(-20)).join('\n\n')
    send(chatId, `Here are your shortened links:\n${linksText}`)
    return
  }
  if (message === user.viewDomainNames) {
    const purchasedDomains = await getPurchasedDomains(chatId)
    if (purchasedDomains.length === 0) {
      send(chatId, 'You have no purchased domains yet.')
      return
    }

    const domainsText = purchasedDomains.join('\n')
    send(chatId, `Here are your purchased domains:\n${domainsText}`)
    return
  }
  if (message === 'Backup Data') {
    if (!isDeveloper(chatId)) return send(chatId, 'not authorized')

    backupTheData()
    return send(chatId, 'Backup created successfully.')
  }
  if (message === 'Restore Data') {
    if (!isDeveloper(chatId)) return send(chatId, 'not authorized')

    restoreData()
    return send(chatId, 'Data restored successfully.')
  }
  if (message === admin.viewUsers) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized')

    const users = await getUsers()
    return send(chatId, `Users: ${users.length}\n${users.join('\n')}`)
  }
  if (message === admin.viewAnalytics) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized')

    const analyticsData = await getAnalytics()
    send(chatId, `Analytics Data:\n${analyticsData.join('\n')}`)
    return
  }
  if (message === user.getSupport) {
    send(chatId, t.support)
    return
  }

  send(chatId, t.unknownCommand)
})

async function getPurchasedDomains(chatId) {
  let ans = await get(domainsOf, chatId)
  if (!ans) return []

  ans = Object.keys(ans).map(d => d.replaceAll('@', '.')) // de sanitize due to mongo db
  return ans.filter(d => d !== '_id')
}

async function getUsers() {
  let ans = await getAll(chatIdOf)
  if (!ans) return []

  return ans.map(a => a._id)
}
// new Date('2023-9-5'), new Date('2023-9'), new Date('2023')
async function getAnalytics() {
  let ans = await getAll(clicksOf)
  if (!ans) return []
  return ans.map(a => `${a._id}: ${a.val} click${a.val === 1 ? '' : 's'}`).sort((a, b) => a.localeCompare(b))
}

async function getShortLinks(chatId) {
  let ans = await get(linksOf, chatId)
  if (!ans) return []

  ans = Object.keys(ans).map(d => ({ shorter: d, url: ans[d] }))
  ans = ans.filter(d => d.shorter !== '_id')

  let ret = []
  for (let i = 0; i < ans.length; i++) {
    const link = ans[i]
    let clicks = (await get(clicksOn, link.shorter)) || 0

    const shorter = (await get(maskOf, link.shorter)) || link.shorter.replaceAll('@', '.')
    ret.push({ clicks, shorter, url: link.url })
  }

  return ret
}

async function ownsDomainName(chatId) {
  return (await getPurchasedDomains(chatId)).length > 0
}

async function isValid(link) {
  const time = await get(expiryOf, link)
  if (time === undefined) return true

  return time > Date.now()
}
async function isSubscribed(chatId) {
  const time = await get(planEndingTime, chatId)
  return time && time > Date.now()
}
async function freeLinksAvailable(chatId) {
  const freeLinks = (await get(freeShortLinksOf, chatId)) || 0
  return freeLinks > 0
}

function restoreData() {
  try {
    const backupJSON = fs.readFileSync('backup.json', 'utf-8')
    const restoredData = JSON.parse(backupJSON)
    Object.assign(state, restoredData.state)
    Object.assign(linksOf, restoredData.linksOf)
    Object.assign(walletOf, restoredData.walletOf)
    Object.assign(expiryOf, restoredData.expiryOf)
    Object.assign(clicksOf, restoredData.clicksOf)
    Object.assign(clicksOn, restoredData.clicksOn)
    Object.assign(fullUrlOf, restoredData.fullUrlOf)
    Object.assign(domainsOf, restoredData.domainsOf)
    Object.assign(nameOf, restoredData.nameOfChatId)
    Object.assign(chatIdOf, restoredData.chatIdOfName)
    Object.assign(chatIdBlocked, restoredData.chatIdBlocked)
    Object.assign(planEndingTime, restoredData.planEndingTime)
    Object.assign(chatIdOfPayment, restoredData.chatIdOfPayment)
    Object.assign(totalShortLinks, restoredData.totalShortLinks)
    Object.assign(freeShortLinksOf, restoredData.freeShortLinksOf)
    Object.assign(freeDomainNamesAvailableFor, restoredData.freeDomainNamesAvailableFor)
    log('Data restored.')
  } catch (error) {
    log('Error restoring data:', error.message)
  }
}

async function backupTheData() {
  const backupData = {
    state: await getAll(state),
    linksOf: await getAll(linksOf),
    walletOf: await getAll(walletOf),
    expiryOf: await getAll(expiryOf),
    fullUrlOf: await getAll(fullUrlOf),
    domainsOf: await getAll(domainsOf),
    chatIdBlocked: await getAll(chatIdBlocked),
    planEndingTime: await getAll(planEndingTime),
    chatIdOfPayment: await getAll(chatIdOfPayment),
    totalShortLinks: await getAll(totalShortLinks),
    freeShortLinksOf: await getAll(freeShortLinksOf),
    freeDomainNamesAvailableFor: await getAll(freeDomainNamesAvailableFor),
    payments: await getAll(payments),
    clicksOf: await getAll(clicksOf),
    clicksOn: await getAll(clicksOn),
    chatIdOf: await getAll(chatIdOf),
    nameOf: await getAll(nameOf),
    planOf: await getAll(planOf),
  }
  const backupJSON = JSON.stringify(backupData, null, 2)
  fs.writeFileSync('backup.json', backupJSON, 'utf-8')
}
async function backupPayments() {
  const data = await getAll(payments)

  const head = 'Mode, Product, Name, Price, ChatId, User Name, Time,Currency\n'
  const backup = data.map(a => a.val).join('\n')
  fs.writeFileSync('payments.csv', head + backup, 'utf-8')
}

async function buyDomain(chatId, domain) {
  // ref https://www.mongodb.com/docs/manual/core/dot-dollar-considerations
  const domainSanitizedForDb = domain.replaceAll('.', '@')

  // set(domainsOf, chatId, domainSanitizedForDb, true)
  // return { success: true }

  const result = await buyDomainOnline(domain)
  if (result.success) {
    set(domainsOf, chatId, domainSanitizedForDb, true)
  }

  return result
}

const formatLinks = links => {
  return links.map(d => `${d.clicks} ${d.clicks === 1 ? 'click' : 'clicks'} → ${d.shorter} → ${d.url}`)
}

const buyDomainFullProcess = async (chatId, domain) => {
  const { error: buyDomainError } = await buyDomain(chatId, domain)
  if (buyDomainError) {
    const m = `Domain purchase fails, try another name. ${chatId} ${domain} ${buyDomainError}`
    log(m)
    send(TELEGRAM_DEV_CHAT_ID, m)
    send(chatId, m)
    return m
  }
  send(
    chatId,
    `Domain ${domain} is now yours.Thank you for choosing us.

Best,
Nomadly Bot`,
    o,
  )

  let info = await get(state, chatId)
  if (info?.askDomainToUseWithShortener === 'No') return

  const { server, error } = await saveDomainInServer(domain) // save domain in railway // can do separately maybe or just send messages of progress to user
  if (error) {
    const m = `Error saving domain in server, contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`
    send(chatId, m)
    return m
  }
  send(
    chatId,
    `Linking domain with your account. Please note that DNS updates can take up to 30 minutes. You can check your DNS update status here: https://www.whatsmydns.net/#A/${domain}`,
  )

  const { error: saveServerInDomainError } = await saveServerInDomain(domain, server)
  if (saveServerInDomainError) {
    const m = `Error saving server in domain ${saveServerInDomainError}`
    send(chatId, m)
    return m
  }
  send(chatId, t.domainBought.replaceAll('{{domain}}', domain))
  regularCheckDns(bot, chatId, domain)
  return false // error = false
}

const auth = async (req, res, next) => {
  log(req.hostname + req.originalUrl)
  const ref = req?.query?.ref || req?.body?.data?.reference // first for crypto and second for webhook fincra
  const pay = await get(chatIdOfPayment, ref)
  if (!pay) return log(t.payError) || res.send(html(t.payError))
  req.pay = { ...pay, ref }
  next()
}

const app = express()
app.use(express.json())
app.use(cors())
app.set('json spaces', 2)
let serverStartTime = new Date()

const addFundsTo = async (walletOf, chatId, coin, valueIn) => {
  if (!['usd', 'ngn'].includes(coin)) throw Error('Dev Please Debug')

  const key = `${coin}In`
  await increment(walletOf, chatId, key, valueIn)
  const { usdBal, ngnBal } = await getBalance(walletOf, chatId)
  send(chatId, t.showWallet(usdBal, ngnBal))
}
//
//
const bankApis = {
  '/bank-pay-plan': async (req, res, ngnIn) => {
    // Validate
    const { ref, chatId, price, plan } = req.pay
    if (!ref || !chatId || !price || !plan) return log(t.argsErr) || res.send(html(t.argsErr))
    if (('' + ref + chatId + price + plan).includes('undefined')) return log(t.argsErr) || res.send(html(t.argsErr))

    // Logs
    del(chatIdOfPayment, ref)
    const usdIn = await ngnToUsd(ngnIn)
    const name = await get(nameOf, chatId)
    set(payments, ref, `Bank, Plan, ${plan}, $${usdIn}, ${chatId}, ${name}, ${new Date()}, ₦${ngnIn}`)

    // Update Wallet
    const ngnPrice = await usdToNgn(price)
    if (usdIn * 1.06 < price) {
      send(chatId, t.sentLessMoney(`${ngnPrice} NGN`, `${ngnIn} NGN`))
      addFundsTo(walletOf, chatId, 'ngn', ngnIn)
      return res.send(html(t.lowPrice))
    }
    if (ngnIn > ngnPrice) {
      addFundsTo(walletOf, chatId, 'ngn', ngnIn - ngnPrice)
      send(chatId, t.sentMoreMoney(`${ngnPrice} NGN`, `${ngnIn} NGN`))
    }

    // Subscribe Plan
    subscribePlan(planEndingTime, freeDomainNamesAvailableFor, planOf, chatId, plan, bot)

    res.send(html())
  },
  '/bank-pay-domain': async (req, res, ngnIn) => {
    // Validate
    const { ref, chatId, price, domain } = req.pay
    if (!ref || !chatId || !price || !domain) return log(t.argsErr) || res.send(html(t.argsErr))

    // Logs
    del(chatIdOfPayment, ref)
    const usdIn = await ngnToUsd(ngnIn)
    const name = await get(nameOf, chatId)
    set(payments, ref, `Bank, Domain, ${domain}, $${usdIn}, ${chatId}, ${name}, ${new Date()}, ₦${ngnIn}`)

    // Update Wallet
    const ngnPrice = await usdToNgn(price)
    if (usdIn * 1.06 < price) {
      send(chatId, t.sentLessMoney(`${ngnPrice} NGN`, `${ngnIn} NGN`))
      addFundsTo(walletOf, chatId, 'ngn', ngnIn)
      return res.send(html(t.lowPrice))
    }
    if (ngnIn > ngnPrice) {
      addFundsTo(walletOf, chatId, 'ngn', ngnIn - ngnPrice)
      send(chatId, t.sentMoreMoney(`${ngnPrice} NGN`, `${ngnIn} NGN`))
    }

    // Buy Domain
    const error = await buyDomainFullProcess(chatId, domain)
    if (error) return res.send(html(error))

    res.send(html())
  },
  '/bank-wallet': async (req, res, ngnIn) => {
    // Validate
    const { ref, chatId } = req.pay
    if (!ref || !chatId) return log(t.argsErr) || res.send(html(t.argsErr))

    // Update Wallet
    const usdIn = await ngnToUsd(ngnIn)
    addFundsTo(walletOf, chatId, 'ngn', ngnIn)
    send(chatId, t.confirmationDepositMoney(`${ngnIn} NGN`, usdIn))

    // Logs
    res.send(html())
    del(chatIdOfPayment, ref)
    const name = await get(nameOf, chatId)
    set(payments, ref, `Bank,Wallet,wallet,$${usdIn},${chatId},${name},${new Date()},${ngnIn} NGN`)
  },
}
//
//
app.post('/webhook', auth, (req, res) => {
  const value = req?.body?.data?.amountReceived
  const coin = req?.body?.data?.currency
  const endpoint = req?.pay?.endpoint
  if (coin !== 'NGN' || isNaN(value) || !bankApis[endpoint]) return log(t.argsErr) || res.send(html(t.argsErr))

  bankApis[endpoint](req, res, Number(value))
})
//
//
app.get('/crypto-pay-plan', auth, async (req, res) => {
  // Validate
  const { ref, chatId, price, plan } = req.pay
  const coin = req?.query?.coin
  const value = req?.query?.value_coin
  if (!ref || !chatId || !plan || !price || !coin || !value) return log(t.argsErr) || res.send(html(t.argsErr))

  // Logs
  del(chatIdOfPayment, ref)
  const name = await get(nameOf, chatId)
  set(payments, ref, `Crypto,Plan,${plan},$${price},${chatId},${name},${new Date()},${value} ${coin}`)

  // Update Wallet
  const usdIn = await convert(value, coin, 'usd')
  if (usdIn * 1.06 < price) {
    send(chatId, t.sentLessMoney(`$${price}`, `$${usdIn}`))
    addFundsTo(walletOf, chatId, 'usd', usdIn)
    return res.send(html(t.lowPrice))
  }
  if (usdIn > price) {
    addFundsTo(walletOf, chatId, 'usd', usdIn - price)
    send(chatId, t.sentMoreMoney(`$${price}`, `$${usdIn}`))
  }

  // Subscribe Plan
  subscribePlan(planEndingTime, freeDomainNamesAvailableFor, planOf, chatId, plan, bot)
  res.send(html())
})
app.get('/crypto-pay-domain', auth, async (req, res) => {
  // Validate
  const { ref, chatId, price, domain } = req.pay
  const coin = req?.query?.coin
  const value = req?.query?.value_coin
  if (!ref || !chatId || !domain || !price || !coin || !value) return log(t.argsErr) || res.send(html(t.argsErr))

  // Logs
  del(chatIdOfPayment, ref)
  const name = await get(nameOf, chatId)
  set(payments, ref, `Crypto,Domain,${domain},$${price},${chatId},${name},${new Date()},${value} ${coin}`)

  // Update Wallet
  const usdIn = await convert(value, coin, 'usd')
  if (usdIn * 1.06 < price) {
    send(chatId, t.sentLessMoney(`$${price}`, `$${usdIn}`))
    addFundsTo(walletOf, chatId, 'usd', usdIn)
    return res.send(html(t.lowPrice))
  }
  if (usdIn > price) {
    addFundsTo(walletOf, chatId, 'usd', usdIn - price)
    send(chatId, t.sentMoreMoney(`$${price}`, `$${usdIn}`))
  }

  // Buy Domain
  const error = await buyDomainFullProcess(chatId, domain)
  if (error) return res.send(html(error))
  res.send(html())
})
app.get('/crypto-wallet', auth, async (req, res) => {
  // Validate
  const { ref, chatId } = req.pay
  const coin = req?.query?.coin
  const value = req?.query?.value_coin
  if (!ref || !chatId || !coin || !value) return log(t.argsErr) || res.send(html(t.argsErr))

  // Update Wallet
  const usdIn = await convert(value, coin, 'usd')
  addFundsTo(walletOf, chatId, 'usd', usdIn)
  send(chatId, t.confirmationDepositMoney(value + ' ' + tickerViewOf[coin], usdIn))

  // Logs
  res.send(html())
  del(chatIdOfPayment, ref)
  const name = await get(nameOf, chatId)
  set(payments, ref, `Crypto,Wallet,wallet,$${usdIn},${chatId},${name},${new Date()},${value} ${coin}`)
})
//
//
app.get('/', (req, res) => {
  res.send(html(t.greet))
})
app.get('/ok', (req, res) => {
  res.send(html('ok'))
})
app.get('/woo', (req, res) => {
  log(req.hostname + req.originalUrl)
  res.send(html('woo'))
})
app.get('/health', (req, res) => {
  res.send(html('health ok'))
})
app.get('/json1444', async (req, res) => {
  await backupTheData()
  const fileName = 'backup.json'
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
  res.setHeader('Content-Type', 'application/json')
  fs.createReadStream(fileName).pipe(res)
})
app.get('/payments12341234', async (req, res) => {
  await backupPayments()
  const fileName = 'payments.csv'
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
  res.setHeader('Content-Type', 'application/json')
  fs.createReadStream(fileName).pipe(res)
})
app.get('/uptime', (req, res) => {
  let now = new Date()
  let uptimeInMilliseconds = now - serverStartTime
  let uptimeInHours = uptimeInMilliseconds / (1000 * 60 * 60)
  res.send(html(`Server has been running for ${uptimeInHours.toFixed(2)} hours.`))
})
//
app.get('/subscribe', (req, res) => {
  const phone = req?.query?.Phone
  const name = req?.query?.['full-name']

  log({ phone, name })
  res.send(html(t.subscribeRCS(phone)))
})
app.get('/unsubscribe', (req, res) => {
  const phone = req?.query?.Phone

  log({ phone })
  res.send(html(t.unsubscribeRCS(phone)))
})
//
app.get('/:id', async (req, res) => {
  const id = req?.params?.id
  if (id === '') return res.json({ message: 'Salam', from: req.hostname })

  const shortUrl = `${req.hostname}/${id}`
  const shortUrlSanitized = shortUrl.replaceAll('.', '@')
  const url = await get(fullUrlOf, shortUrlSanitized)
  if (!url) return res.status(404).send(html('Link not found'))
  if (!(await isValid(shortUrlSanitized))) return res.status(404).send(html(t.linkExpired))

  res.redirect(url)
  increment(clicksOf, 'total')
  increment(clicksOf, today())
  increment(clicksOf, week())
  increment(clicksOf, month())
  increment(clicksOf, year())
  increment(clicksOn, shortUrlSanitized)
})
const startServer = () => {
  const port = process.env.PORT || 3000
  app.listen(port, () => log(`Server ran away!\nhttp://localhost:${port}\nWaiting for db to connect...`))
}


const tryConnectReseller = async () => {
  try {
    await getRegisteredDomainNames()
    connect_reseller_working = true
  } catch (error) {
    //
    axios.get('https://api.ipify.org/').then(ip => {
      const message = `Please add <code>${ip.data}</code> to whitelist in Connect Reseller, API Section. https://global.connectreseller.com/tools/profile`
      send(TELEGRAM_DEV_CHAT_ID, message, { parse_mode: 'HTML' })
      send(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' })
    }).catch((error) => {
      console.log("Error:", error.message);
    })
    //
  }
}

tryConnectReseller()
