// Generates simple PNG app icons (fuel gauge glyph) with zero image-library
// dependencies, using Node's built-in zlib to hand-build the PNG bytes.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const NAVY = [15, 23, 42, 255] // #0f172a
const WHITE = [241, 245, 249, 255]
const AMBER = [251, 191, 36, 255]

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4)
  const set = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    buf[i] = color[0]
    buf[i + 1] = color[1]
    buf[i + 2] = color[2]
    buf[i + 3] = color[3]
  }

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.42
  const corner = size * 0.18

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // rounded-square background
      const dx = Math.max(0, Math.abs(x - cx) - (size / 2 - corner))
      const dy = Math.max(0, Math.abs(y - cy) - (size / 2 - corner))
      const inside = dx * dx + dy * dy <= corner * corner
      if (inside) set(x, y, NAVY)
    }
  }

  // gauge ring
  const ringR = r
  const ringW = size * 0.045
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - cx, y - cy)
      if (dist <= ringR && dist >= ringR - ringW) {
        // only draw the top ~270 degrees (gauge arc, open at the bottom)
        const angle = Math.atan2(y - cy, x - cx) // -PI..PI
        const deg = (angle * 180) / Math.PI
        if (!(deg > 45 && deg < 135)) set(x, y, WHITE)
      }
    }
  }

  // needle pointing to upper-right (like a full tank)
  const needleAngle = (-40 * Math.PI) / 180
  const needleLen = r * 0.72
  for (let t = 0; t < needleLen; t += 0.5) {
    const nx = cx + Math.cos(needleAngle) * t
    const ny = cy + Math.sin(needleAngle) * t
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        set(Math.round(nx + ox), Math.round(ny + oy), AMBER)
      }
    }
  }
  // hub
  for (let y = -4; y <= 4; y++) {
    for (let x = -4; x <= 4; x++) {
      if (x * x + y * y <= 16) set(Math.round(cx + x), Math.round(cy + y), AMBER)
    }
  }

  return buf
}

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c >>> 0
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePNG(rgbaBuf, size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter type: none
    rgbaBuf.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idatData = zlib.deflateSync(raw, { level: 9 })

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const outDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const png = encodePNG(drawIcon(size), size)
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png)
  console.log(`wrote icon-${size}.png (${png.length} bytes)`)
}
