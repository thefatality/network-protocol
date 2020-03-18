const os = require('os')
const Cap = require('cap').Cap
const decoders = require('cap').decoders
const config = require('../config')
const {addrToArrayBuffer, dataToArrayBuffer} = require('../utils')
const PROTOCOL = decoders.PROTOCOL

class DataLinkLayer {
  static ETHERNET_PACKET_SIZE = 14

  static ETHERNET_DST_MAC_OFFSET = 0
  static ETHERNET_DST_MAC_SIZE = 6

  static ETHERNET_SRC_MAC_OFFSET = 6
  static ETHERNET_SRC_MAC_SIZE = 6

  static ETHERNET_TYPE_OFFSET = 12
  static ETHERNET_TYPE_SIZE = 2

  static ETHERNET_PACKET_OFFSET = 0
  static LINK_DATA_OFFSET = 14

  constructor(bufSize, filter = '') {
    this.cap = new Cap()
    this.device = Cap.findDevice(config.LOCAL_IP)
    this.buffer = Buffer.alloc(bufSize)
    this.localMac = DataLinkLayer.getMac()
    this.cap.open(this.device, filter, 1024 * 1024 * 10, this.buffer)
  }

  sendData(data, dstMac, ethernetType) {
    if (!(data && data instanceof ArrayBuffer)) {
      return
    }
    const ethernetPacket = this._createEthernetPacket(dstMac, ethernetType)

    const dataLinkPacket = new ArrayBuffer(data.byteLength + ethernetPacket.byteLength)

    const ethernetView = new DataView(dataLinkPacket, DataLinkLayer.ETHERNET_PACKET_OFFSET, DataLinkLayer.ETHERNET_PACKET_SIZE)
    const dataView = new DataView(dataLinkPacket, DataLinkLayer.LINK_DATA_OFFSET, data.byteLength)

    dataToArrayBuffer(ethernetPacket, ethernetView)
    dataToArrayBuffer(data, dataView)

    this.cap.send(Buffer.from(dataLinkPacket), dataLinkPacket.byteLength)
  }

  close() {
    this.cap.close()
  }

  receivePacket(cb) {
    this.cap.setMinBytes && this.cap.setMinBytes(0)
    this.cap.on('packet', (nbytes, trunc) => {
      if (trunc) return
      const {info, offset} = dataLinkerLayer.handlePacket(this.buffer.slice(0, nbytes))
      if (info.dstmac !== dataLinkerLayer.localMac) return
      const {type} = info
      cb(this.buffer.slice(offset, nbytes), PROTOCOL.ETHERNET[type])
    })
  }

  handlePacket(packet) {
    return decoders.Ethernet(packet)
  }

  static getMac() {
    const cardList = Object.values(os.networkInterfaces())
    for (let i = 0; i < cardList.length; ++i) {
      const card = cardList[i]
      if (card[card.length - 1].address === config.LOCAL_IP) {
        return card[card.length - 1].mac
      }
    }
  }

  _createEthernetPacket(dstMac, ethernetType) {
    const ethernetPacket = new ArrayBuffer(DataLinkLayer.ETHERNET_PACKET_SIZE)

    const dstMacView = new DataView(ethernetPacket, DataLinkLayer.ETHERNET_DST_MAC_OFFSET, DataLinkLayer.ETHERNET_DST_MAC_SIZE)
    const srcMacView = new DataView(ethernetPacket, DataLinkLayer.ETHERNET_SRC_MAC_OFFSET, DataLinkLayer.ETHERNET_SRC_MAC_SIZE)
    const ethernetTypeView = new DataView(ethernetPacket, DataLinkLayer.ETHERNET_TYPE_OFFSET, DataLinkLayer.ETHERNET_TYPE_SIZE)

    addrToArrayBuffer(dstMac, dstMacView)
    addrToArrayBuffer(this.localMac, srcMacView)
    ethernetTypeView.setInt16(0, ethernetType)
    return ethernetPacket
  }
}

const dataLinkerLayer = new DataLinkLayer(128, 'tcp')

module.exports = dataLinkerLayer
