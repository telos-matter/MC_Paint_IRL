// Temp script file to make it easier to dev. Later on I will put it back in the index.html file

document.getElementById('uploadInput').addEventListener('change', handleFileSelection);

// FIXME make sure painting doesn't surpass screen size so that the moving keys won't scroll down, or disable scrolling with keys

/**
 * Handles uploading a new image file.
 * Retrieves the data and calls imageUploaded function
 * to continue the work
 */
function handleFileSelection(event) {
    const file = event.target.files[0]
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function (data) {
            const img = new Image()
            img.src = data.target.result
            
            img.onload = function () {
                imageLoaded(img)
            }
        }
        
        reader.readAsDataURL(file)
    }
}

/**
 * Takes on the work flow when an image has been loaded
 */
function imageLoaded (img) {
    // Remove upload button
    document.getElementById('uploadInput').remove()

    const colorDiv = document.getElementById('colorDiv')
    const canvas = document.getElementById('imageCanvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = img.width
    canvas.height = img.height
    
    // Draw the image initially to be able to retrieve its pixels
    ctx.drawImage(img, 0, 0, img.width, img.height)
    const imageData = ctx.getImageData(0, 0, img.width, img.height)
    const painting = new Painting(imageData, img.width, img.height)

    // Paint first time
    paint(canvas, painting, colorDiv)

    // Bind keys
    document.addEventListener('keydown', function(event) {
        let triggered = false
        console.log(event.code)
        switch(event.code) {
            case 'Space':
                painting.goNextCursorPos()
                triggered = true
                break
            case 'ArrowUp': case 'KeyW':
                painting.moveCursor(0, -1)
                triggered = true
                break
            case 'ArrowRight': case 'KeyD': case 'D':
                painting.moveCursor(1, 0)
                triggered = true
                break
            case 'ArrowDown': case 'KeyS':
                painting.moveCursor(0, 1)
                triggered = true
                break
            case 'ArrowLeft': case 'KeyA':
                painting.moveCursor(-1, 0)
                triggered = true
                break
        }
        if (triggered) {
            paint(canvas, painting, colorDiv)
        }
    });
}

function paint(canvas, painting, colorDiv) {
    painting.paintOnCanvas(canvas)
    let currentColor = painting.pixels[painting.cursorY][painting.cursorX]
    colorDiv.style.backgroundColor = currentColor.toRGBString()
}

/**
 * A struct/class that represents an RGB color
 */
class Color {
    constructor (r, g, b) {
        this.r = r
        this.g = g
        this.b = b
        this.rgbString = `rgb(${this.r}, ${this.g}, ${this.b})`
    }

    /**
     * Returns the RGB string to set the ctx.fillStyle with
     */
    toRGBString () {
        return this.rgbString
    }
}

/**
 * A class that represents a painting
 */
class Painting {
    /**
     * Minimum number of horizontal blocks that a painting can span over
     */
    static MIN_HOR_BLOCKS_COUNT = 1
    /**
     * Minimum number of vertical blocks that a painting can span over
     */
    static MIN_VER_BLOCKS_COUNT = 1
    /**
     * Maximum number of horizontal blocks that a painting can span over
     */
    static MAX_HOR_BLOCKS_COUNT = 4
    /**
     * Maximum number of vertical blocks that a painting can span over
     */
    static MAX_VER_BLOCKS_COUNT = 4
    /**
     * How many minecraft pixel are there per block
     */
    static _PIXELS_PER_BLOCk = 16

    /**
     * Initializes the information about the painting
     * from the imageData
     * @param {*} imageData the imageData you get from the context of the canvas 
     * @param {int} width the width of the image
     * @param {int} height the height of the image
     */
    constructor (imageData, width, height) {
        this.imageWidth = width
        this.imageHeight = height
        
        // Retrieve all the colors
        this.colors = Array(height)
        let data = imageData.data
        for (let y = 0; y < height; y++) {
            this.colors[y] = Array(width)
            for (let x = 0; x < width; x++) {
                let offset = (y * width + x) * 4
                let r = data[offset +0]
                let g = data[offset +1]
                let b = data[offset +2]
                // let a = data[offset +3] // We don't care about the alpha
                this.colors[y][x] = new Color(r, g, b)
            }
        }
        
        // Determine blocks count
        const IMAGE_BLOCK_SIZE = 160 // The size in pixel of 1 block in the images provided in https://minecraft.fandom.com/wiki/Painting
        let horBlocksCount = Math.round(width/IMAGE_BLOCK_SIZE)
        let verBlocksCount = Math.round(height/IMAGE_BLOCK_SIZE)
        let validHorCount = Painting.MIN_HOR_BLOCKS_COUNT <= horBlocksCount && horBlocksCount <= Painting.MAX_HOR_BLOCKS_COUNT
        let validVerCount = Painting.MIN_VER_BLOCKS_COUNT <= verBlocksCount && verBlocksCount <= Painting.MAX_VER_BLOCKS_COUNT
        this.sizeKnown = validHorCount && validVerCount
        // If the painting size was not determined then give it a default of 1
        if (! this.sizeKnown) {
            horBlocksCount = 1
            verBlocksCount = 1
        }
        
        this.setPaintingSize(horBlocksCount, verBlocksCount)
        
        this.cursorX = 0
        this.cursorY = 0
        // TODO add direction of scrolling
    }

    /**
     * Goes to the next cursor position
     */
    goNextCursorPos () {
        this.cursorX++
        if (this.cursorX === this.horPixelsCount) {
            this.cursorX = 0
            this.cursorY++
            if (this.cursorY === this.verPixelsCount) {
                this.cursorY = 0
            }
        }
    }

    /**
     * Moves the cursor relative to where it is. Wraps if it goes over
     * @param {int} dx 
     * @param {int} dy 
     */
    moveCursor (dx, dy) {
        this.cursorX += dx
        if (this.cursorX >= this.horPixelsCount) {
            this.cursorX = 0
        } else if (this.cursorX < 0) {
            this.cursorX = this.horPixelsCount -1
        }
        this.cursorY += dy
        if (this.cursorY >= this.verPixelsCount) {
            this.cursorY = 0
        } else if (this.cursorY < 0) {
            this.cursorY = this.verPixelsCount -1
        }
    }

    /**
     * Sets the new paintings size and updates the pixels accordingly
     * @param {int} horBlockCount
     * @param {int} verBlockCount 
     */
    setPaintingSize (horBlocksCount, verBlocksCount) {
        this.horBlocksCount = horBlocksCount
        this.verBlocksCount = verBlocksCount
        
        this._retrievePixels()
    }

    /**
     * Retrieves the pixels from this.colors based on
     * the size of this painting
     */
    _retrievePixels () {
        this.horPixelsCount = this.horBlocksCount * Painting._PIXELS_PER_BLOCk
        this.verPixelsCount = this.verBlocksCount * Painting._PIXELS_PER_BLOCk
        let horDelta = Math.floor(this.imageWidth/this.horPixelsCount)
        let verDelta = Math.floor(this.imageHeight/this.verPixelsCount)
        this.pixels = Array(this.verPixelsCount)
        for (let y = 0; y < this.verPixelsCount; y++) {
            this.pixels[y] = Array(this.horPixelsCount)
            for (let x = 0; x < this.horPixelsCount; x++) {
                this.pixels[y][x] = this.colors[y*verDelta][x*horDelta]
            }
        }
    }

    /**
     * Paints the painting on the canvas
     * @param {*} canvas the canvas to paint on. It is expected to only be used by the painting
     */
    paintOnCanvas (canvas) {
        const PIXEL_SIZE = 15 // The size in pixels of each minecraft pixel that will be displayed
        const RULER_LINE_SIZE = 1 // The line above the dashes
        const RULER_DASHES_SIZE = 2 // The dashes on the ruler
        const RULER_SIZE = RULER_LINE_SIZE + RULER_DASHES_SIZE // Height of the horizontal ruler and the width of the vertical ruler
        
        let x_start = RULER_SIZE +0.1 // The +0.1 to give it that really beautiful effect of separated blocks. Not sure how it works. Found it by accident. I think it has something to do with the fact that pixels are drawn by ints
        let y_start = RULER_SIZE +0.1
        
        const ctx = canvas.getContext('2d')
        
        // Set the canvas size and clear it
        canvas.width = this.horPixelsCount*PIXEL_SIZE +x_start +1 // The +1 to have space after it for ruler line size
        canvas.height = this.verPixelsCount*PIXEL_SIZE +y_start +1
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Draw the pixels
        for (let y = 0; y < this.verPixelsCount; y++) {
            for (let x = 0; x < this.horPixelsCount; x++) {
                let pixel = this.pixels[y][x]
                ctx.fillStyle = pixel.toRGBString()
                ctx.fillRect(x_start + x*PIXEL_SIZE, y_start + y*PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
            }
        }
        
        // Draw the rulers
        const RULER_STROKE_STYLE = 'red'
        // Horizontal ruler
        Painting._drawLine(ctx, x_start, 0, canvas.width, 0, RULER_LINE_SIZE, RULER_STROKE_STYLE)
        for (let x = 0; x <= this.horPixelsCount; x++) {
            let bigDash = x % Painting._PIXELS_PER_BLOCk === 0
            let lineWidth = bigDash ? 1 : 0.5
            let dashSize = bigDash ? RULER_DASHES_SIZE : RULER_DASHES_SIZE/2
            const x_point = x_start + x*PIXEL_SIZE
            Painting._drawLine(ctx, x_point, RULER_LINE_SIZE, x_point, RULER_LINE_SIZE +dashSize, lineWidth, RULER_STROKE_STYLE)
            if (bigDash && x != 0 && x != this.horPixelsCount) { // On big dashes but not at the start and end
                // Draw the line that goes across the painting
                Painting._drawLine(ctx, x_point, RULER_LINE_SIZE +dashSize, x_point, RULER_LINE_SIZE +dashSize + this.verPixelsCount*PIXEL_SIZE, lineWidth, RULER_STROKE_STYLE)
            }
        }
        // Vertical ruler
        Painting._drawLine(ctx, 0, y_start, 0, canvas.height, RULER_LINE_SIZE, RULER_STROKE_STYLE)
        for (let y = 0; y <= this.verPixelsCount; y++) {
            let bigDash = y % Painting._PIXELS_PER_BLOCk === 0
            let lineWidth = bigDash ? 0.8 : 0.5
            let dashSize = bigDash ? RULER_DASHES_SIZE : RULER_DASHES_SIZE/2
            const y_point = y_start + y*PIXEL_SIZE
            Painting._drawLine(ctx, RULER_LINE_SIZE, y_point, RULER_LINE_SIZE +dashSize, y_point, lineWidth, RULER_STROKE_STYLE)
            if (bigDash && y != 0 && y != this.verPixelsCount) { // On big dashes but not at the start and end
                // Draw the line that goes across the painting
                Painting._drawLine(ctx, RULER_LINE_SIZE +dashSize, y_point, RULER_LINE_SIZE +dashSize  + this.horPixelsCount*PIXEL_SIZE, y_point, lineWidth, RULER_STROKE_STYLE)
            }
        }
        
        // If size is known then draw the cursor
        if (this.sizeKnown) {
            const CURSOR_SIZE = 1 // Width vertically and length horizontally in pixels
            const CURSOR_STROKE_STYLE = 'red'
            
            ctx.lineWidth = CURSOR_SIZE
            ctx.strokeStyle = CURSOR_STROKE_STYLE
            ctx.rect(x_start +this.cursorX*PIXEL_SIZE, y_start +this.cursorY*PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
            ctx.stroke()
        }
    }

    /**
     * Draws a line
     */
    static _drawLine(ctx, x1, y1, x2, y2, lineWidth = 1, strokeStyle = 'black') {
        ctx.beginPath();
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = strokeStyle
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
    }

}

