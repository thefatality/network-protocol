const {addrToArrayBuffer, dataToArrayBuffer} = require('../utils')

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

  static createHeader(headerInfo) {
    const {
      dstIp,
      srcIp,
      data,
      optionsData = null,
      tos = 0,
      identification = 0, // 32-47 bit
      flags = 0, // 48-51 bit
      offset = 0, // 52-55 bit
      TTL = 64,
      protocol,
      checkSum = 0,
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
    const headerPacket = new ArrayBuffer(totalLength)

    const versionAndHeaderLenView = new DataView(headerPacket, IPProtocolLayer.VERSION_AND_LENGTH_OFFSET, IPProtocolLayer.VERSION_AND_LENGTH_SIZE)
    const tosView = new DataView(headerPacket, IPProtocolLayer.TOS_OFFSET, IPProtocolLayer.TOS_SIZE)
    const totalLenView = new DataView(headerPacket, IPProtocolLayer.TOTAL_LENGTH_OFFSET, IPProtocolLayer.TOTAL_LENGTH_SIZE)
    const identificationView = new DataView(headerPacket, IPProtocolLayer.IDENTIFICATION_OFFSET, IPProtocolLayer.IDENTIFICATION_SIZE)
    const flagsAndOffsetView = new DataView(headerPacket, IPProtocolLayer.FLAGS_AND_OFFSET_OFFSET, IPProtocolLayer.FLAGS_AND_OFFSET_SIZE)
    const ttlView = new DataView(headerPacket, IPProtocolLayer.TTL_OFFSET, IPProtocolLayer.TTL_SIZE)
    const protocolView = new DataView(headerPacket, IPProtocolLayer.PROTOCOL_OFFSET, IPProtocolLayer.PROTOCOL_SIZE)
    const checksumView = new DataView(headerPacket, IPProtocolLayer.CHECKSUM_OFFSET, IPProtocolLayer.CHECKSUM_SIZE)
    const srcIpView = new DataView(headerPacket, IPProtocolLayer.SRC_IP_OFFSET, IPProtocolLayer.SRC_IP_SIZE)
    const dstIpView = new DataView(headerPacket, IPProtocolLayer.DST_IP_OFFSET, IPProtocolLayer.DST_IP_SIZE)

    versionAndHeaderLenView.setInt8(0, version << 4 | headerLength)
    tosView.setInt8(0, tos)
    totalLenView.setInt16(0, totalLength)
    identificationView.setInt16(0, identification)
    flagsAndOffsetView.setInt16(0, flags << 13 | offset)
    ttlView.setInt8(0, TTL)
    protocolView.setInt8(0, protocol)
    checksumView.setInt16(0, checkSum) // 直接设置为0

    addrToArrayBuffer(srcIp, srcIpView)
    addrToArrayBuffer(dstIp, dstIpView)

    // 可选字段内容
    if (optionsData && optionsData instanceof ArrayBuffer) {
      const optionsView = new DataView(headerPacket, IPProtocolLayer.OPTIONS_OFFSET, (headerLength - 5) * 4)
      dataToArrayBuffer(optionsData, optionsView)
      // 填充0
      for (let i = 0; i < Math.ceil(optionsDataLen / 4) * 4 - optionsDataLen; ++i) {
        optionsView.setInt8(i + optionsDataLen, 0)
      }
    }

    // 数据内容
    if (data && data instanceof ArrayBuffer) {
      const dataView = new DataView(headerPacket, headerLength * 4, dataLen)
      dataToArrayBuffer(data, dataView)
    }

    return headerPacket
  }

  handlePacket(packet) {

  }
}

module.exports = IPProtocolLayer
