const pincelColor = [0, 0, 200]

const mouse = {
  x: 0,
  y: 0,
  isMouseDown: false
}

const mask = {
  pixels: [],
  image: null,
  paintablePixels: 0
}

const drawing = {
  pixels: [],
  image: null
}

function getBrightness([r, g, b]) {
  return Math.max(r,g,b) / 255
}

function changeBrightness([r, g, b], brightness) {

  function truncate(val) {
    return Math.min(255, val)
  }

  return [ 
    truncate(r * brightness),
    truncate(g * brightness),
    truncate(b * brightness)
  ]
}

function combineColorsWithAlpha([r1, g1, b1, a1], [r2, g2, b2, a2]) {
  function toDecimal(val) {
    return val / 255
  }

  function fromDecimal(val) {
    return val * 255
  }

  // a01 = (1 - a0)·a1 + a0
  // r01 = ((1 - a0)·a1·r1 + a0·r0) / a01
  // g01 = ((1 - a0)·a1·g1 + a0·g0) / a01
  // b01 = ((1 - a0)·a1·b1 + a0·b0) / a01
  const a = ((1 - toDecimal(a1)) * toDecimal(a2)) + toDecimal(a1)
  return [
    fromDecimal((((1 - toDecimal(a1)) * toDecimal(a2) * toDecimal(r2)) + (toDecimal(a1) * toDecimal(r1))) / a),
    fromDecimal((((1 - toDecimal(a1)) * toDecimal(a2) * toDecimal(g2)) + (toDecimal(a1) * toDecimal(g1))) / a),
    fromDecimal((((1 - toDecimal(a1)) * toDecimal(a2) * toDecimal(b2)) + (toDecimal(a1) * toDecimal(b1))) / a),
    fromDecimal(a)
  ]
}

function combineColors([r1, g1, b1], [r2, g2, b2]) {
  return [
    (r1 + r2) / 2,
    (g1 + g2) / 2,
    (b1 + b2) / 2
  ]
}

function isSameColor([r1,g1,b1], [r2,g2,b2]) {
  return r1 == r2 && g1 == g2 && b1 == b2
}

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const paintCanvas = document.createElement('canvas')
const paintCtx = paintCanvas.getContext('2d')
paintCanvas.width = 500
paintCanvas.height = 500
// document.body.appendChild(paintCanvas)

paintCtx.lineWidth = 60
paintCtx.lineCap = 'round'
paintCtx.strokeStyle = `rgb(${pincelColor[0]}, ${pincelColor[1]},${pincelColor[2]})`

const maskCanvas = document.createElement('canvas')
const maskCtx = maskCanvas.getContext('2d')
maskCanvas.width = 500
maskCanvas.height = 500
mask.image = new Image()
mask.image.onload = () => {
  maskCtx.drawImage(mask.image, 0, 0)
  mask.pixels = maskCtx.getImageData(0, 0, canvas.width, canvas.height)
  for(let i = 0; i <= mask.pixels.data.length; i += 4) {
    if(!isSameColor([mask.pixels.data[i], mask.pixels.data[i + 1], mask.pixels.data[i + 2]], [0,0,0])) {
      mask.paintablePixels = mask.paintablePixels + 1
    }
  }
}
mask.image.src = 'mask.png'

const fenceCanvas = document.createElement('canvas')
const fenceCtx = fenceCanvas.getContext('2d')
fenceCanvas.width = 500
fenceCanvas.height = 500
drawing.image = new Image()
drawing.image.onload = () => {
  ctx.drawImage(drawing.image, 0, 0)
  fenceCtx.drawImage(drawing.image, 0, 0)
  drawing.pixels = fenceCtx.getImageData(0, 0, canvas.width, canvas.height)
}
drawing.image.src = 'fence.png'

function processMask() {
  let paintedPixels = 0
  const buffer = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const paintedArea = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height).data
  for(let i = 0; i < mask.pixels.data.length; i += 4) {
    let maskR = mask.pixels.data[i]
    let maskG = mask.pixels.data[i + 1]
    let maskB = mask.pixels.data[i + 2]

    let paintedR = paintedArea[i]
    let paintedG = paintedArea[i + 1]
    let paintedB = paintedArea[i + 2]

    let drawingR = drawing.pixels.data[i]
    let drawingG = drawing.pixels.data[i + 1]
    let drawingB = drawing.pixels.data[i + 2]
    let drawingA = drawing.pixels.data[i + 3]

    // if(maskR !== 0 && maskG !== 0 && maskB !== 0 && maskR !== 255 && maskG !== 255 && maskB !== 255) {
    //   console.log([maskR, maskG, maskB])
    // }

    if(maskR !== 0 && maskG !== 0 && maskB !== 0 && 
      (paintedR !== 0 || paintedG !== 0 || paintedB !== 0)) {
      // pincel color
      // drawing.pixels.data[i]     = paintedArea[i]
      // drawing.pixels.data[i + 1] = paintedArea[i + 1]
      // drawing.pixels.data[i + 2] = paintedArea[i + 2]

      // a type of "opacity"
      // let combinedColors = combineColors(pincelColor, [maskR, maskG, maskB])
      // drawing.pixels.data[i]     = combinedColors[0]
      // drawing.pixels.data[i + 1] = combinedColors[1]
      // drawing.pixels.data[i + 2] = combinedColors[2]

      // using color combination and mask shading
      const maskBrightness = getBrightness([maskR, maskG, maskB])
      const color = combineColorsWithAlpha([pincelColor[0], pincelColor[1], pincelColor[2], maskBrightness * 255], [drawingR, drawingG, drawingB, drawingA])
      
      buffer.data[i]     = color[0]
      buffer.data[i + 1] = color[1]
      buffer.data[i + 2] = color[2]
      paintedPixels++
    }
  }
  ctx.putImageData(buffer, 0, 0)
  return paintedPixels
}

function onPaint(x, y) {
  paintCtx.beginPath()
  paintCtx.moveTo(mouse.x, mouse.y)
  paintCtx.lineTo(x, y)
  paintCtx.stroke()
  paintCtx.closePath()
  mouse.x = x
  mouse.y = y

  console.log(processMask(), mask.paintablePixels)
}

canvas.addEventListener('mousedown', (evt) => {
  evt.preventDefault()
  mouse.isMouseDown = true
})

canvas.addEventListener('mouseup', (evt) => {
  evt.preventDefault()
  mouse.isMouseDown = false
})

canvas.addEventListener('mousemove', (evt) => {
  const currX = (evt.pageX - canvas.offsetLeft)
  const currY = (evt.pageY - canvas.offsetTop)
  if(mouse.isMouseDown && mouse.x >= 0 && mouse.y >= 0) {
    onPaint(currX, currY)
  } else {
    mouse.x = currX
    mouse.y = currY
  }
})
