const decoders = require('cap').decoders
const {dataToArrayBuffer} = require('../utils')

class UDPProtocolLayer {
  static LENGTH_WITHOUT_DATA = 8

  static SRC_PORT_OFFSET = 0
  static SRC_PORT_LENGTH = 2

  static DST_PORT_OFFSET = 2
  static DST_PORT_LENGTH = 2

  static PACKET_SIZE_OFFSET = 4
  static PACKET_SIZE_LENGTH = 2

  static CHECKSUM_OFFSET = 6
  static CHECKSUM_LENGTH = 2

  static DATA_OFFSET = 8

  static createHeader(headerInfo) {
    const {
      srcPort,
      dstPort,
      data,
    } = headerInfo

    if (srcPort === undefined) {
      throw new Error('headerInfo required srcPort')
    }
    if (dstPort === undefined) {
      throw new Error('headerInfo required dstPort')
    }

    let dataLen = UDPProtocolLayer.LENGTH_WITHOUT_DATA

    if (data && data instanceof ArrayBuffer) {
      dataLen += data.byteLength
    }

    const header = new ArrayBuffer(dataLen)

    const srcPortView = new DataView(header, UDPProtocolLayer.SRC_PORT_OFFSET, UDPProtocolLayer.SRC_PORT_LENGTH)
    const dstPortView = new DataView(header, UDPProtocolLayer.DST_PORT_OFFSET, UDPProtocolLayer.DST_PORT_LENGTH)
    const packetSizeView = new DataView(header, UDPProtocolLayer.PACKET_SIZE_OFFSET, UDPProtocolLayer.PACKET_SIZE_LENGTH)
    const checksumView = new DataView(header, UDPProtocolLayer.CHECKSUM_OFFSET, UDPProtocolLayer.CHECKSUM_LENGTH)

    srcPortView.setInt16(0, srcPort)
    dstPortView.setInt16(0, dstPort)
    packetSizeView.setInt16(0, dataLen)

    // checksum设置成0
    checksumView.setInt16(0, 0)

    if (data && data instanceof ArrayBuffer) {
      const dataView = new DataView(header, this.DATA_OFFSET, data.byteLength)
      dataToArrayBuffer(data, dataView)
    }

    return header
  }

  static handlePacket(packet) {
    return decoders.UDP(packet)
  }
}

module.exports = UDPProtocolLayer
