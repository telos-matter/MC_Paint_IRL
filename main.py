import tkinter as tk
from tkinter import Canvas
from PIL import Image

ROWS = 16 * 4
COLUMNS = 16 * 4

def readRGBImage (path: str) -> Image:
    image = Image.open(path)
    return image.convert('RGB')

def getColors (image: Image) -> list:
    colors = []
    width, height = image._size
    wd = width / ROWS
    hd = height / COLUMNS
    
    for i in range(ROWS):
        for j in range(COLUMNS):
            color = image.getpixel((i * wd, j * hd))
            colors.append(color)
    return colors

if __name__ == '__main__':
    image = readRGBImage("skull.webp")
    colors = getColors(image)
    
    color_canvas_w = 200
    color_canvas_h = color_canvas_w

    cell_size = 10
    image_canvas_w = cell_size * COLUMNS
    image_canvas_h = cell_size * ROWS

    root = tk.Tk()
    frame_1 = tk.Toplevel(root)
    frame_1.grab_set()

    # frame_2 = tk.Toplevel(root)
    # frame_2.grab_set()

    image_canvas = Canvas(root, width=image_canvas_w, height=image_canvas_h)
    image_canvas.pack()
    # image_canvas.create_rectangle(0, 0, 50, 50, fill='black')

    color_canvas = Canvas(frame_1, width=color_canvas_w, height=color_canvas_h)
    color_canvas.pack()

    def toStrColor (rgb):
        r = "{:02x}".format(rgb[0])
        g = "{:02x}".format(rgb[1])
        b = "{:02x}".format(rgb[2])
        return f"#{r}{g}{b}"

    def nextColor (event=None):
        print('pressed')
        nextColor.i += 1
        ci = nextColor.i

        str_color = toStrColor(colors[ci])
        color_canvas.create_rectangle(0, 0, color_canvas_w, color_canvas_h, fill=str_color, outline='black')

        for i in range(COLUMNS):
            for j in range(ROWS):
                str_color = toStrColor(colors[(i * COLUMNS) + j])
                image_canvas.
                image_canvas.create_rectangle(i*cell_size, j*cell_size, cell_size, cell_size, fill=str_color)

    nextColor.i = -1
    
    frame_1.bind('<space>', nextColor)
    root.mainloop()

