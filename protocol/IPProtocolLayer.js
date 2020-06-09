const decoders = require('cap').decoders
const PROTOCOL = decoders.PROTOCOL
const {
  addrToArrayBuffer,
  dataToArrayBuffer,
  calcChecksum,
} = require('../utils')
const config = require('../config')

class IPProtocolLayer {
  static IP_HEADER_MAX_LENGTH = 60
  static IP_HEADER_FIXED_LENGTH = 20

  static VERSION_AND_LENGTH_OFFSET = 0
  static VERSION_AND_LENGTH_SIZE = 1

  static TOS_OFFSET = 1
  static TOS_SIZE = 1

  static TOTAL_LENGTH_OFFSET = 2
  static TOTAL_LENGTH_SIZE = 2

  static IDENTIFICATION_OFFSET = 4
  static IDENTIFICATION_SIZE = 2

  static FLAGS_AND_OFFSET_OFFSET = 6
  static FLAGS_AND_OFFSET_SIZE = 2

  static TTL_OFFSET = 8
  static TTL_SIZE = 1

  static PROTOCOL_OFFSET = 9
  static PROTOCOL_SIZE = 1

  static CHECKSUM_OFFSET = 10
  static CHECKSUM_SIZE = 2

  static SRC_IP_OFFSET = 12
  static SRC_IP_SIZE = 4

  static DST_IP_OFFSET = 16
  static DST_IP_SIZE = 4

  static OPTIONS_OFFSET = 20

  static createPacket(headerInfo) {
    const {
      dstIp,
      srcIp,
      data,
      optionsData = null,
      tos = 0,
      flags = 0b010, // 48-51 bit
      offset = 0, // 52-55 bit
      TTL = 64,
      protocol,
    } = headerInfo
    const version = 4

    let optionsDataLen = 0
    if (optionsData && optionsData instanceof ArrayBuffer) {
      optionsDataLen = optionsData.byteLength
      if (optionsDataLen > IPProtocolLayer.IP_HEADER_MAX_LENGTH - IPProtocolLayer.IP_HEADER_FIXED_LENGTH
      ) {
        throw new Error('data overflow')
      }
    }

    let dataLen = 0
    if (data && data instanceof ArrayBuffer) {
      dataLen = data.byteLength
    }

    const headerLength = Math.ceil((optionsDataLen + IPProtocolLayer.IP_HEADER_FIXED_LENGTH) / 4)
    const totalLength = headerLength * 4 + dataLen
    const ipPacket = new ArrayBuffer(totalLength)

    const versionAndHeaderLenView = new DataView(ipPacket, IPProtocolLayer.VERSION_AND_LENGTH_OFFSET, IPProtocolLayer.VERSION_AND_LENGTH_SIZE)
    const tosView = new DataView(ipPacket, IPProtocolLayer.TOS_OFFSET, IPProtocolLayer.TOS_SIZE)
    const totalLenView = new DataView(ipPacket, IPProtocolLayer.TOTAL_LENGTH_OFFSET, IPProtocolLayer.TOTAL_LENGTH_SIZE)
    const identificationView = new DataView(ipPacket, IPProtocolLayer.IDENTIFICATION_OFFSET, IPProtocolLayer.IDENTIFICATION_SIZE)
    const flagsAndOffsetView = new DataView(ipPacket, IPProtocolLayer.FLAGS_AND_OFFSET_OFFSET, IPProtocolLayer.FLAGS_AND_OFFSET_SIZE)
    const ttlView = new DataView(ipPacket, IPProtocolLayer.TTL_OFFSET, IPProtocolLayer.TTL_SIZE)
    const protocolView = new DataView(ipPacket, IPProtocolLayer.PROTOCOL_OFFSET, IPProtocolLayer.PROTOCOL_SIZE)
    const checksumView = new DataView(ipPacket, IPProtocolLayer.CHECKSUM_OFFSET, IPProtocolLayer.CHECKSUM_SIZE)
    const srcIpView = new DataView(ipPacket, IPProtocolLayer.SRC_IP_OFFSET, IPProtocolLayer.SRC_IP_SIZE)
    const dstIpView = new DataView(ipPacket, IPProtocolLayer.DST_IP_OFFSET, IPProtocolLayer.DST_IP_SIZE)

    versionAndHeaderLenView.setInt8(0, version << 4 | headerLength)
    tosView.setInt8(0, tos)
    totalLenView.setInt16(0, totalLength)

    const identification = Math.floor(Math.random() * 65535)
    console.log('identification = ', identification.toString(16));
    identificationView.setInt16(0, identification)
    flagsAndOffsetView.setInt16(0, flags << 13 | offset)
    ttlView.setInt8(0, TTL)
    protocolView.setInt8(0, protocol)

    let checksum = 0
    checksumView.setInt16(0, checksum)

    addrToArrayBuffer(srcIp, srcIpView)
    addrToArrayBuffer(dstIp, dstIpView)

    checksum = calcChecksum(ipPacket)
    checksumView.setInt16(0, checksum)

    // 可选字段内容
    if (optionsData && optionsData instanceof ArrayBuffer) {
      const optionsView = new DataView(ipPacket, IPProtocolLayer.OPTIONS_OFFSET, (headerLength - 5) * 4)
      dataToArrayBuffer(optionsData, optionsView)
      // 填充0
      for (let i = 0; i < Math.ceil(optionsDataLen / 4) * 4 - optionsDataLen; ++i) {
        optionsView.setInt8(i + optionsDataLen, 0)
      }
    }

    // 数据内容
    if (data && data instanceof ArrayBuffer) {
      const dataView = new DataView(ipPacket, headerLength * 4, dataLen)
      dataToArrayBuffer(data, dataView)
    }


    return ipPacket
  }

  static handlePacket(packet) {
    const res = decoders.IPV4(packet)
    const {info: {dstaddr}} = res
    return dstaddr === config.LOCAL_IP ? res : null
  }
}

module.exports = IPProtocolLayer
