const decoders = require('cap').decoders
const PROTOCOL = decoders.PROTOCOL
const {
  addrToArrayBuffer,
  mergeArrayBuffer,
  dataToArrayBuffer,
  calcChecksum,
} = require('../utils')

class TCPProtocolLayer {
  static HEADER_FIXED_SIZE = 20

  static SRC_PORT_OFFSET = 0
  static SRC_PORT_SIZE = 2

  static DST_PORT_OFFSET = 2
  static DST_PORT_SIZE = 4

  static SEQ_NUM_OFFSET = 4
  static SEQ_NUM_SIZE = 4

  static ACK_NUM_OFFSET = 8
  static ACK_NUM_SIZE = 4

  static DATA_OFFSET_REVERSED_FLAGS_OFFSET = 12
  static DATA_OFFSET_REVERSED_FLAGS_SIZE = 2

  static WINDOW_OFFSET = 14
  static WINDOW_SIZE = 2

  static CHECKSUM_OFFSET = 16
  static CHECKSUM_SIZE = 2

  static URGENT_POINTER_OFFSET = 18
  static URGENT_POINTER_SIZE = 2

  static OPTION_SIZE = 12 // 填充三个选项
  static OPTION_KIND_SIZE = 1
  static OPTION_LENGTH_SIZE = 1

  static NOP_OPTION_KIND = 1

  static MAXIMUM_SEGMENT_SIZE_OPTION_SIZE = 4
  static MAXIMUM_SEGMENT_OPTION_KIND = 2

  static WINDOW_SCALE_OPTION_KIND = 3
  static WINDOW_SCALE_OPTION_SIZE = 3
  static WINDOW_SCALE_SHIFT_BYTES = 8

  static SACK_PERMITTED_OPTION_KIND = 4
  static SACK_PERMITTED_OPTION_SIZE = 2

  static UGR_OFFSET = 5
  static ACK_OFFSET = 4
  static PSH_OFFSET = 3
  static RST_OFFSET = 2
  static SYN_OFFSET = 1
  static FIN_OFFSET = 0

  static PSEUDO_HEADER_LENGTH = 12
  static PSEUDO_SRC_PORT_OFFSET = 0
  static PSEUDO_SRC_PORT_SIZE = 4
  static PSEUDO_DST_PORT_OFFSET = 4
  static PSEUDO_DST_PORT_SIZE = 4
  static PSEUDO_PROTOCOL_OFFSET = 8
  static PSEUDO_PROTOCOL_SIZE = 2
  static PSEUDO_TCP_LENGTH_OFFSET = 10
  static PSEUDO_TCP_LENGTH_SIZE = 2


  static createHeader(headerInfo) {
    const {
      srcIp,
      dstIp,
      srcPort,
      dstPort,
      seqNum,
      ackNum,
      UGR,
      ACK,
      PSH,
      RST,
      SYN,
      FIN,
      windowSize,
      urgentPtr,
      data,
    } = headerInfo

    let dataLen = 0
    if (data instanceof ArrayBuffer) {
      dataLen = data.byteLength
    }
    const tcpPacket = new ArrayBuffer(TCPProtocolLayer.HEADER_FIXED_SIZE + TCPProtocolLayer.OPTION_SIZE + dataLen)

    const srcPortView = new DataView(tcpPacket, TCPProtocolLayer.SRC_PORT_OFFSET, TCPProtocolLayer.SRC_PORT_SIZE)
    const dstPortView = new DataView(tcpPacket, TCPProtocolLayer.DST_PORT_OFFSET, TCPProtocolLayer.DST_PORT_SIZE)
    const seqNumView = new DataView(tcpPacket, TCPProtocolLayer.SEQ_NUM_OFFSET, TCPProtocolLayer.SEQ_NUM_SIZE)
    const ackNumView = new DataView(tcpPacket, TCPProtocolLayer.ACK_NUM_OFFSET, this.ACK_NUM_SIZE)
    const dataFlagsView = new DataView(tcpPacket, TCPProtocolLayer.DATA_OFFSET_REVERSED_FLAGS_OFFSET, TCPProtocolLayer.DATA_OFFSET_REVERSED_FLAGS_SIZE)
    const windowView = new DataView(tcpPacket, TCPProtocolLayer.WINDOW_OFFSET, TCPProtocolLayer.WINDOW_SIZE)
    const checksumView = new DataView(tcpPacket, TCPProtocolLayer.CHECKSUM_OFFSET, TCPProtocolLayer.CHECKSUM_SIZE)
    const urgentView = new DataView(tcpPacket, TCPProtocolLayer.URGENT_POINTER_OFFSET, TCPProtocolLayer.URGENT_POINTER_SIZE)
    const mssOptionView = new DataView(tcpPacket, TCPProtocolLayer.HEADER_FIXED_SIZE, TCPProtocolLayer.MAXIMUM_SEGMENT_SIZE_OPTION_SIZE)
    const windowScaleOptionView = new DataView(tcpPacket, TCPProtocolLayer.HEADER_FIXED_SIZE + TCPProtocolLayer.MAXIMUM_SEGMENT_SIZE_OPTION_SIZE, TCPProtocolLayer.WINDOW_SCALE_OPTION_SIZE + 1) // 使用nop进行1字节填充
    const sackPermittedView = new DataView(tcpPacket, TCPProtocolLayer.HEADER_FIXED_SIZE + TCPProtocolLayer.MAXIMUM_SEGMENT_SIZE_OPTION_SIZE + TCPProtocolLayer.WINDOW_SCALE_OPTION_SIZE + 1, 2 + TCPProtocolLayer.SACK_PERMITTED_OPTION_SIZE)

    srcPortView.setInt16(0, srcPort)
    dstPortView.setInt16(0, dstPort)
    seqNumView.setInt32(0, seqNum)
    ackNumView.setInt32(0, ackNum)

    const headerTotalLength = TCPProtocolLayer.HEADER_FIXED_SIZE + TCPProtocolLayer.OPTION_SIZE
    const dataOffset = Math.ceil(headerTotalLength / 4)

    let flags = 0
    if (UGR) {
      flags |= (1 << TCPProtocolLayer.UGR_OFFSET)
    }
    if (ACK) {
      flags |= (1 << TCPProtocolLayer.ACK_OFFSET)
    }
    if (PSH) {
      flags |= (1 << TCPProtocolLayer.PSH_OFFSET)
    }
    if (RST) {
      flags |= (1 << TCPProtocolLayer.RST_OFFSET)
    }
    if (SYN) {
      flags |= (1 << TCPProtocolLayer.SYN_OFFSET)
    }
    if (FIN) {
      flags |= (1 << TCPProtocolLayer.FIN_OFFSET)
    }
    // 数据偏移占最高的4个比特位
    dataFlagsView.setInt16(0, (dataOffset << (16 - 4) | flags))

    windowView.setInt16(0, windowSize)

    let checksum = 0
    checksumView.setInt16(0, checksum)

    urgentView.setInt16(0, urgentPtr)

    const mss = 1460
    mssOptionView.setInt8(0, TCPProtocolLayer.MAXIMUM_SEGMENT_OPTION_KIND)
    mssOptionView.setInt8(TCPProtocolLayer.OPTION_KIND_SIZE, TCPProtocolLayer.MAXIMUM_SEGMENT_SIZE_OPTION_SIZE)
    mssOptionView.setInt16(TCPProtocolLayer.OPTION_KIND_SIZE + TCPProtocolLayer.OPTION_LENGTH_SIZE, mss)

    const shiftCount = 8
    windowScaleOptionView.setInt8(0, TCPProtocolLayer.NOP_OPTION_KIND) //填充对齐
    windowScaleOptionView.setInt8(TCPProtocolLayer.OPTION_KIND_SIZE, TCPProtocolLayer.WINDOW_SCALE_OPTION_KIND)
    windowScaleOptionView.setInt8(TCPProtocolLayer.OPTION_KIND_SIZE + TCPProtocolLayer.OPTION_KIND_SIZE, TCPProtocolLayer.WINDOW_SCALE_OPTION_SIZE)
    windowScaleOptionView.setInt8(TCPProtocolLayer.OPTION_KIND_SIZE + TCPProtocolLayer.OPTION_KIND_SIZE + TCPProtocolLayer.OPTION_LENGTH_SIZE, shiftCount)

    sackPermittedView.setInt8(0, TCPProtocolLayer.NOP_OPTION_KIND)
    sackPermittedView.setInt8(1, TCPProtocolLayer.NOP_OPTION_KIND)
    sackPermittedView.setInt8(2, TCPProtocolLayer.SACK_PERMITTED_OPTION_KIND)
    sackPermittedView.setInt8(3, TCPProtocolLayer.SACK_PERMITTED_OPTION_SIZE)

    if (dataLen !== 0) {
      const tcpDataView = new DataView(tcpPacket, TCPProtocolLayer.HEADER_FIXED_SIZE + TCPProtocolLayer.OPTION_SIZE * 2, dataLen)
      dataToArrayBuffer(data, tcpDataView)
    }

    const pseudoHeader = TCPProtocolLayer._createPseudoHeader({
      srcIp,
      dstIp,
      tcpPacket
    })
    checksum = calcChecksum(mergeArrayBuffer(pseudoHeader, tcpPacket))
    checksumView.setInt16(0, checksum)

    return tcpPacket
  }

  static handlePacket(packet) {
    return decoders.TCP(packet)
  }

  static _createPseudoHeader(headerInfo) {
    const {
      srcIp,
      dstIp,
      tcpPacket,
    } = headerInfo

    if (!srcIp || !dstIp) {
      throw new Error('srcIp & dstIp is required')
    }

    if (!(tcpPacket && tcpPacket instanceof ArrayBuffer)) {
      throw new Error('tcp packet is null')
    }

    const pseudoHeader = new ArrayBuffer(TCPProtocolLayer.PSEUDO_HEADER_LENGTH)

    const srcIpView = new DataView(pseudoHeader, TCPProtocolLayer.PSEUDO_SRC_PORT_OFFSET, TCPProtocolLayer.PSEUDO_SRC_PORT_SIZE)
    const dstIpView = new DataView(pseudoHeader, TCPProtocolLayer.PSEUDO_DST_PORT_OFFSET, TCPProtocolLayer.PSEUDO_DST_PORT_SIZE)
    const reservedProtocolView = new DataView(pseudoHeader, TCPProtocolLayer.PSEUDO_PROTOCOL_OFFSET, TCPProtocolLayer.PSEUDO_PROTOCOL_SIZE)
    const tcpLengthView = new DataView(pseudoHeader, TCPProtocolLayer.PSEUDO_TCP_LENGTH_OFFSET, TCPProtocolLayer.PSEUDO_TCP_LENGTH_SIZE)

    addrToArrayBuffer(srcIp, srcIpView)
    addrToArrayBuffer(dstIp, dstIpView)
    reservedProtocolView.setInt16(0, PROTOCOL.IP.TCP) // 保留位全部置0
    tcpLengthView.setInt16(0, tcpPacket.byteLength)

    return pseudoHeader
  }
}

module.exports = TCPProtocolLayer
