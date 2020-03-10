const decoders = require('cap').decoders
const PROTOCOL = decoders.PROTOCOL
const config = require('../config')
const ARPProtocolLayer = require('./ARPProtocolLayer')
const IPProtocolLayer = require('./IPProtocolLayer')
const UDPProtocolLayer = require('./UDPProtocolLayer')
const dataLinkerLayer = require('../datalink/DataLinkLayer')

class ProtocolManager {
  static ipMacTable = new Map()
  static dataWaitToSend = null

  static sendData(data, dstIp) {
    const routerMac = ProtocolManager.ipMacTable.get(dstIp)
    dataLinkerLayer.sendData(data, routerMac, PROTOCOL.ETHERNET.IPV4)
  }

  static getRouterMac() {
    if (ProtocolManager.ipMacTable.get(config.ROUTER_IP)) {
      return ProtocolManager.ipMacTable.get(config.ROUTER_IP)
    }
    const arpPacket = ARPProtocolLayer.createHeader({
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
      default:
        return null
    }
  }
}

ProtocolManager.ipMacTable.set(config.ROUTER_IP, 'b6:f6:d6:ba:c7:64')

ProtocolManager.getRouterMac()
module.exports = ProtocolManager
