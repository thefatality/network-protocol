const decoders = require('cap').decoders
const PROTOCOL = decoders.PROTOCOL
const config = require('../config')

const {addrToArrayBuffer} = require('../utils')

class ARPProtocolLayer {
  static ARP_PACKET_SIZE = 28

  static HARDWARE_TYPE_OFFSET = 0
  static HARDWARE_TYPE_SIZE = 2

  static PROTOCOL_TYPE_OFFSET = 2
  static PROTOCOL_TYPE_SIZE = 2

  static MAC_ADDR_LENGTH_OFFSET = 4
  static MAC_ADDR_LENGTH_SIZE = 1

  static IP_ADDR_LENGTH_OFFSET = 5
  static IP_ADDR_LENGTH_SIZE = 1

  static OPTION_TYPE_OFFSET = 6
  static OPTION_TYPE_SIZE = 2

  static SRC_MAC_ADDR_OFFSET = 8
  static SRC_MAC_ADDR_SIZE = 6

  static SRC_IP_ADDR_OFFSET = 14
  static SRC_IP_ADDR_SIZE = 4

  static DST_MAC_ADDR_OFFSET = 18
  static DST_MAC_ADDR_SIZE = 6

  static DST_IP_ADDR_OFFSET = 24
  static DST_IP_ADDR_SIZE = 4

  static createPacket(headerInfo) {
    const {
      hardwareType = 1,
      protocolType = PROTOCOL.ETHERNET.IPV4,
      macAddrLen = 6,
      ipAddrLen = 4,
      optionType = 1, // 1为请求 2为响应
      srcMacAddr,
      srcIp = config.LOCAL_IP,
      dstMacAddr = '00:00:00:00:00:00', // 请求目标Mac地址时目标Mac地址字段为全0
      dstIp,
    } = headerInfo

    if (!(srcMacAddr && srcIp && dstMacAddr && dstIp)) {
      throw new Error('ip & mac is required')
    }

    const packet = new ArrayBuffer(ARPProtocolLayer.ARP_PACKET_SIZE)

    const hardwareTypeView = new DataView(packet, ARPProtocolLayer.HARDWARE_TYPE_OFFSET, ARPProtocolLayer.HARDWARE_TYPE_SIZE)
    const protocolTypeView = new DataView(packet, ARPProtocolLayer.PROTOCOL_TYPE_OFFSET, ARPProtocolLayer.PROTOCOL_TYPE_SIZE)
    const macAddrLenView = new DataView(packet, ARPProtocolLayer.MAC_ADDR_LENGTH_OFFSET, ARPProtocolLayer.MAC_ADDR_LENGTH_SIZE)
    const ipAddrLenView = new DataView(packet, ARPProtocolLayer.IP_ADDR_LENGTH_OFFSET, ARPProtocolLayer.IP_ADDR_LENGTH_SIZE)
    const optionTypeView = new DataView(packet, ARPProtocolLayer.OPTION_TYPE_OFFSET, ARPProtocolLayer.OPTION_TYPE_SIZE)
    const srcMacView = new DataView(packet, ARPProtocolLayer.SRC_MAC_ADDR_OFFSET, ARPProtocolLayer.SRC_MAC_ADDR_SIZE)
    const srcIpView = new DataView(packet, ARPProtocolLayer.SRC_IP_ADDR_OFFSET, ARPProtocolLayer.SRC_IP_ADDR_SIZE)
    const dstMacView = new DataView(packet, ARPProtocolLayer.DST_MAC_ADDR_OFFSET, ARPProtocolLayer.DST_MAC_ADDR_SIZE)
    const dstIpView = new DataView(packet, ARPProtocolLayer.DST_IP_ADDR_OFFSET, ARPProtocolLayer.DST_IP_ADDR_SIZE)

    hardwareTypeView.setInt16(0, hardwareType)
    protocolTypeView.setInt16(0, protocolType)
    macAddrLenView.setInt8(0, macAddrLen)
    ipAddrLenView.setInt8(0, ipAddrLen)
    optionTypeView.setInt16(0, optionType)

    addrToArrayBuffer(srcMacAddr, srcMacView)
    addrToArrayBuffer(srcIp, srcIpView)
    addrToArrayBuffer(dstMacAddr, dstMacView)
    addrToArrayBuffer(dstIp, dstIpView)

    return packet
  }
}

module.exports = ARPProtocolLayer
