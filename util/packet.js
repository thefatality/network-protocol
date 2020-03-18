const {mergeArrayBuffer} = require('./buffer')

function calcChecksum(packet) {
  if (!packet instanceof ArrayBuffer) {
    return
  }
  const len = packet.byteLength
  if (len % 2 !== 0) { // 不足16位的用0补齐
    packet = mergeArrayBuffer(packet, new ArrayBuffer(1))
  }
  const wordCount = packet.byteLength / 2
  const packetView = new DataView(packet)

  let sum = 0
  for (let i = 0; i < wordCount; ++i) {
    sum += packetView.getUint16(i * 2)
  }

  return (~((sum & 0xffff) + (sum >> 16))) & 0xffff
}

module.exports = {
  calcChecksum
}
