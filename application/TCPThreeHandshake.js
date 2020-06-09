const decoders = require('cap').decoders
const config = require('../config')
const ProtocolManager = require('../protocol/ProtocolManager')
const TCPProtocolLayer = require('../protocol/TCPProtocolLayer')
const PROTOCOL = decoders.PROTOCOL

class TCPThreeHandshake {
  constructor(tcpInfo) {
    const {
      srcIp = config.LOCAL_IP,
      dstIp,
      dstPort,
      windowSize = 17520,
    } = tcpInfo

    this.srcIp = srcIp
    this.dstIp = dstIp
    this.srcPort = Math.floor(Math.random() * 10000 + 10000)
    console.log('TCPThreeHandshake port = ', this.srcPort)
    this.dstPort = dstPort
    this.seqNum = Math.floor(Math.random() * 4294967295)
    this.packet = TCPProtocolLayer.createHeader({
      srcIp: this.srcIp,
      dstIp: this.dstIp,
      srcPort: this.srcPort,
      dstPort: this.dstPort,
      seqNum: this.seqNum,
      ackNum: 0,
      UGR: false,
      ACK: false,
      PSH: false,
      RST: false,
      SYN: true,
      FIN: false,
      windowSize,
      urgentPtr: 0,
    })
  }

  createIpPacket() {
    const ipProtocol = ProtocolManager.getProtocol(PROTOCOL.IP.IPV4)
    return ipProtocol.createPacket({
      srcIp: this.srcIp,
      dstIp: this.dstIp,
      data: this.packet,
      protocol: PROTOCOL.IP.TCP,
      flags: 0b010,
    })
  }

  sendData() {
    ProtocolManager.sendPacket(this.createIpPacket(), true)
  }

  handleData(data) {
    console.log(data)
    const {seqno, ackno, flags} = data
    if (this.seqNum + 1 === ackno && flags === 0b000000010010 /* SYN ACK置为1*/) {
      this.replySynAck(seqno)
    }
    setTimeout(() => {
      console.log('release connection')
      this.release(seqno)
    }, 2000)
  }

  replySynAck(seqno) {
    this.packet = TCPProtocolLayer.createHeader({
      srcIp: this.srcIp,
      dstIp: this.dstIp,
      srcPort: this.srcPort,
      dstPort: this.dstPort,
      seqNum: this.seqNum + 1,
      ackNum: seqno + 1,
      UGR: false,
      ACK: true,
      PSH: false,
      RST: false,
      SYN: false,
      FIN: false,
      windowSize: 17520,
      urgentPtr: 0,
    })
    this.sendData()
  }

  release(seqno) {
    this.packet = TCPProtocolLayer.createHeader({
      srcIp: this.srcIp,
      dstIp: this.dstIp,
      srcPort: this.srcPort,
      dstPort: this.dstPort,
      seqNum: this.seqNum + 2,
      ackNum: 0,
      UGR: false,
      ACK: true,
      PSH: false,
      RST: false,
      SYN: false,
      FIN: true,
      windowSize: 17520,
      urgentPtr: 0,
    })
    this.sendData()
  }
}

module.exports = TCPThreeHandshake
