function addrToArrayBuffer(addr, bufferView) {
  let addrArr = null
  if (addr.includes('.')) { // ip地址
    addrArr = addr.split('.')
  } else { // mac地址
    addrArr = addr.split(':')
    for (let i = 0; i < addrArr.length; ++i) { // mac地址为16进制表示
      addrArr[i] = `0x${addrArr[i]}`
    }
  }

  addrArr.forEach((part, index) => {
    bufferView.setInt8(index, parseInt(part))
  })
}

function dataToArrayBuffer(srcBuffer, dstBufferView) {
  if (!(srcBuffer && srcBuffer instanceof ArrayBuffer)) {
    return
  }
  const srcBufferView = new DataView(srcBuffer)
  for (let i = 0; i < srcBuffer.byteLength; ++i) {
    dstBufferView.setInt8(i, srcBufferView.getInt8(i))
  }
}

function mergeArrayBuffer(...bufs) {
  const validBuf = bufs.filter(buf => buf instanceof ArrayBuffer)
  let resLen = 0
  validBuf.forEach((buf) => {
    resLen += buf.byteLength
  })

  const resBuf = new ArrayBuffer(resLen)
  const resView = new DataView(resBuf)
  let i = 0
  validBuf.forEach((buf) => {
    const len = buf.byteLength
    const bufView = new DataView(buf)
    for (let j = 0; j < len; ++j) {
      resView.setInt8(i++, bufView.getInt8(j))
    }
  })

  return resBuf
}

module.exports = {
  addrToArrayBuffer,
  dataToArrayBuffer,
  mergeArrayBuffer
}
