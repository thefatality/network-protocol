const decoders = require('cap').decoders
const PROTOCOL = decoders.PROTOCOL
const config = require('../config')
const ARPProtocolLayer = require('./ARPProtocolLayer')
const IPProtocolLayer = require('./IPProtocolLayer')
const UDPProtocolLayer = require('./UDPProtocolLayer')
const TCPProtocolLayer = require('./TCPProtocolLayer')
const dataLinkerLayer = require('../datalink/DataLinkLayer')
const ApplicationManager = require('../application/ApplicationManager')

class ProtocolManager {
  static ipMacTable = new Map()
  static dataWaitToSend = null

  static sendPacket(data, monitor) {
    const routerMac = ProtocolManager.ipMacTable.get(config.ROUTER_IP)
    if (monitor) {
      dataLinkerLayer.receivePacket(ProtocolManager.receivePacket)
    }
    dataLinkerLayer.sendData(data, routerMac, PROTOCOL.ETHERNET.IPV4)
  }

  static getRouterMac() {
    const arpPacket = ARPProtocolLayer.createPacket({
      srcMacAddr: dataLinkerLayer.localMac,
      dstIp: config.ROUTER_IP,
    })
    dataLinkerLayer.receivePacket((nbytes, trunc) => {
    })
    dataLinkerLayer.sendData(arpPacket, 'ff:ff:ff:ff:ff:ff', PROTOCOL.ETHERNET.ARP)
  }

  static getProtocol(protocol) {
    switch (protocol) {
      case PROTOCOL.ETHERNET.ARP:
        return ARPProtocolLayer
      case PROTOCOL.IP.IPV4:
        return IPProtocolLayer
      case PROTOCOL.IP.UDP:
        return UDPProtocolLayer
      case PROTOCOL.IP.TCP:
        return TCPProtocolLayer
      default:
        return null
    }
  }

  static receivePacket(buffer, type) {
    let protocol = PROTOCOL.IP[type]
    let data
    while (true) {
      try {
        console.log('data = ', data);
        data = ProtocolManager
          .getProtocol(protocol)
          .handlePacket(buffer)
        if (data === null) break
        const {offset, info} = data
        buffer = buffer.slice(offset)
        if (buffer.length === 0) break
        protocol = info.protocol
      } catch (e) {}
    }
    data && ApplicationManager.dispatchData(data.info)
    // dataLinkerLayer.close()
  }
}

ProtocolManager.ipMacTable.set(config.ROUTER_IP, 'fc:d7:33:4c:79:e8')

module.exports = ProtocolManager
