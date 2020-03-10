const decoders = require('cap').decoders
const config = require('../config')
const ProtocolManager = require('../protocol/ProtocolManager')

const PROTOCOL = decoders.PROTOCOL

class DNSApplication {
  static TRANSITION_ID_OFFSET = 0
  static TRANSITION_ID_LENGTH = 2

  static FLAGS_OFFSET = 2
  static FLAGS_LENGTH = 2

  static QUESTION_COUNT_OFFSET = 4
  static QUESTION_COUNT_LENGTH = 2

  static ANSWER_RRS_OFFSET = 6
  static ANSWER_RRS_LENGTH = 2

  static AUTHORITY_RRS_OFFSET = 8
  static AUTHORITY_RRS_LENGTH = 2

  static ADDITION_RRS_OFFSET = 10
  static ADDITION_RRS_LENGTH = 2

  static DOMAIN_NAME_OFFSET = 0

  static QUESTION_CLASS_LENGTH = 2
  static QUESTION_CLASS = 1

  static QUESTION_TYPE_LENGTH = 2
  static QUESTION_TYPE_A = 1

  static UDP_DST_PORT = 53

  constructor(destIp, domainName = 'www.baidu.com') {
    this.port = Math.ceil((Math.random() * 3000 + 2500))
    console.log('DNSApp port = ', this.port.toString(16), this.port);
    this.domainName = domainName
    this.destIp = destIp
    // 初始一字节的最低级域名长度和结尾一字节的结束符0
    const domainNameLen = domainName.length + 2
    // transition为两字节大小
    this.transitionId = (Math.random() * 65535) | 0
    console.log('this.transitionId = ', this.transitionId.toString(16), this.transitionId)
    this.headerBuffer = new ArrayBuffer(12)
    this.queryBuffer = new ArrayBuffer(domainNameLen + DNSApplication.QUESTION_TYPE_LENGTH + DNSApplication.QUESTION_TYPE_LENGTH)
    this.constructDNSPacketHeader()
    this.constructDNSPacketQuestion()
  }

  constructDNSPacketHeader() {
    // headerBuffer
    const transitionIdView = new DataView(this.headerBuffer, DNSApplication.TRANSITION_ID_OFFSET, DNSApplication.TRANSITION_ID_LENGTH)
    const flagsView = new DataView(this.headerBuffer, DNSApplication.FLAGS_OFFSET, DNSApplication.FLAGS_LENGTH)
    const questionCountView = new DataView(this.headerBuffer, DNSApplication.QUESTION_COUNT_OFFSET, DNSApplication.QUESTION_COUNT_LENGTH)
    const answerRRSView = new DataView(this.headerBuffer, DNSApplication.ANSWER_RRS_OFFSET, DNSApplication.ANSWER_RRS_LENGTH)
    const authorityRRSView = new DataView(this.headerBuffer, DNSApplication.AUTHORITY_RRS_OFFSET, DNSApplication.AUTHORITY_RRS_LENGTH)
    const additionRRSView = new DataView(this.headerBuffer, DNSApplication.ADDITION_RRS_OFFSET, DNSApplication.ADDITION_RRS_LENGTH)

    transitionIdView.setInt16(0, this.transitionId)

    const opCode = 0b0000000100000000
    flagsView.setInt16(0, opCode)

    const questionCount = 1
    questionCountView.setInt16(0, questionCount)

    const answerRR = 0
    answerRRSView.setInt16(0, answerRR)

    const authorityRR = 0
    authorityRRSView.setInt16(0, authorityRR)

    const additionRR = 0
    additionRRSView.setInt16(0, additionRR)
  }

  constructDNSPacketQuestion() {
    const domainNameLen = this.domainName.length + 2

    const domainNameView = new DataView(this.queryBuffer, DNSApplication.DOMAIN_NAME_OFFSET, domainNameLen)
    const questionsTypeView = new DataView(this.queryBuffer, domainNameLen, DNSApplication.QUESTION_TYPE_LENGTH)
    const questionClassView = new DataView(this.queryBuffer, domainNameLen + DNSApplication.QUESTION_TYPE_LENGTH, DNSApplication.QUESTION_CLASS_LENGTH)

    // 计算域名部分
    const domainNamePart = this.domainName.split('.')
    const domainBuffer = new Int8Array(domainNameLen)
    let i = 0
    domainNamePart.forEach(domain => {
      domainBuffer[i++] = domain.length
      Array.from(domain).forEach(c => {
        domainBuffer[i++] = c.charCodeAt()
      })
    })
    domainBuffer[i] = 0

    let offset = 0
    domainBuffer.forEach(e => {
      domainNameView.setInt8(offset++, e)
    })

    questionsTypeView.setInt16(0, DNSApplication.QUESTION_TYPE_A)
    questionClassView.setInt16(0, DNSApplication.QUESTION_CLASS)
  }

  queryDomain() {
    const dnsPacket = new ArrayBuffer(this.headerBuffer.byteLength + this.queryBuffer.byteLength)

    const packetView = new DataView(dnsPacket)
    const headerView = new DataView(this.headerBuffer)
    const queryView = new DataView(this.queryBuffer)

    let offset = 0
    for (let i = 0; i < this.headerBuffer.byteLength; ++i) {
      packetView.setInt8(offset++, headerView.getInt8(i))
    }

    for (let i = 0; i < this.queryBuffer.byteLength; ++i) {
      packetView.setInt8(offset++, queryView.getInt8(i))
    }

    // 创建udp包头
    const UDPPacket = ProtocolManager.getProtocol(PROTOCOL.IP.UDP).createHeader({
      srcPort: this.port,
      dstPort: DNSApplication.UDP_DST_PORT,
      data: dnsPacket
    })

    // 创建ip包头
    const IPPacket = ProtocolManager.getProtocol(PROTOCOL.IP.IPV4).createHeader({
      dstIp: this.destIp,
      srcIp: config.LOCAL_IP,
      data: UDPPacket,
      protocol: PROTOCOL.IP.UDP
    })

    ProtocolManager.sendData(IPPacket, config.ROUTER_IP)
  }
}

module.exports = DNSApplication
