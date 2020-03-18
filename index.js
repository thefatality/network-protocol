const config = require('./config')
const constant = require('./constant')
const ApplicationManager = require('./application/ApplicationManager')

// const DNSApplication = require('./application/DNSApplication')
//
// const dns = new DNSApplication('172.20.10.1')
// dns.queryDomain()

const TCPThreeHandshake = require('./application/TCPThreeHandshake')

const baiduIp = '39.156.66.14'
const threeHandshake = new TCPThreeHandshake({
  srcIp: config.LOCAL_IP,
  dstIp: baiduIp,
  dstPort: constant.HTTPS_PORT,
})

ApplicationManager.registerApplication(threeHandshake)

threeHandshake.sendData()
