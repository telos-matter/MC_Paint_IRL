// Temp script file to make it easier to dev. Later on I will put it back in the index.html file

document.getElementById('uploadInput').addEventListener('change', handleFileSelection);

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
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    // Turn the image data into a 2D-array of RGB pixels
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const painting = new Painting(imageData, img.width, img.height)

    console.log(painting)

    painting.paintOnCanvas(canvas)

}

/**
 * A struct/class that represents an RGB color
 */
class Color {
    constructor (r, g, b) {
        this.r = r
        this.g = g
        this.b = b
    }

    /**
     * Returns the RGB string to set the ctx.fillStyle with
     */
    toRGBString () {
        return `rgb(${this.r}, ${this.g}, ${this.b})`
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
        this.horBlocksCount = horBlocksCount
        this.verBlocksCount = verBlocksCount
        
        this._retrievePixels()
        // // If blocks count was determined, retrieve pixel colors
        // if (this.horBlocksCount !== null && this.verBlocksCount !== null) {
        //     this.horPixelsCount = this.horBlocksCount * Painting._PIXELS_PER_BLOCk
        //     this.verPixelsCount = this.verBlocksCount * Painting._PIXELS_PER_BLOCk
        //     let horDelta = Math.floor(width/this.horPixelsCount)
        //     let verDelta = Math.floor(height/this.verPixelsCount)
        //     this.pixels = Array(this.verPixelsCount)
        //     for (let y = 0; y < this.verPixelsCount; y++) {
        //         this.pixels[y] = Array(this.horPixelsCount)
        //         for (let x = 0; x < this.horPixelsCount; x++) {
        //             this.pixels[y][x] = this.colors[y*verDelta][x*horDelta]
        //         }
        //     }
        // } else {
        //     this.pixels = null
        //     this.horPixelsCount = null
        //     this.verPixelsCount = null
        // }
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
        if (this.canPaint()) {
            const PIXEL_SIZE = 11 // The size in pixels of each minecraft pixel that will be displayed
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
        
        } else {
            throw new Error("Shouldn't be called if it cannot draw")
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

    /**
     * 
     * @returns if this painting can be painted on a canvas. Or
     * does the user need to determine the blocks size
     */
    canPaint () {
        return this.pixels !== null
    }
}

