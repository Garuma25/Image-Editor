import * as fs from 'fs';

class Color {
  red: number;
  green: number;
  blue: number;

  constructor() {
    this.red = 0;
    this.green = 0;
    this.blue = 0;
  }
}

class Image {
  private pixels: Color[][];

  constructor(width: number, height: number) {
    this.pixels = Array.from({ length: width }, () =>
      Array.from({ length: height }, () => new Color())
    );
  }

  getWidth(): number {
    return this.pixels.length;
  }

  getHeight(): number {
    return this.pixels[0].length;
  }

  set(x: number, y: number, color: Color): void {
    this.pixels[x][y] = color;
  }

  get(x: number, y: number): Color {
    return this.pixels[x][y];
  }
}

class ImageEditor {
  public static main(args: string[]): void {
    new ImageEditor().run(args);
  }

  public run(args: string[]): void {
    try {
      if (args.length < 3) {
        this.usage();
        return;
      }

      const inputFile = args[0];
      const outputFile = args[1];
      const filter = args[2];

      const image = this.read(inputFile);

      if (filter === 'grayscale' || filter === 'greyscale') {
        if (args.length !== 3) {
          this.usage();
          return;
        }
        this.grayscale(image);
      } else if (filter === 'invert') {
        if (args.length !== 3) {
          this.usage();
          return;
        }
        this.invert(image);
      } else if (filter === 'emboss') {
        if (args.length !== 3) {
          this.usage();
          return;
        }
        this.emboss(image);
      } else if (filter === 'motionblur') {
        if (args.length !== 4) {
          this.usage();
          return;
        }

        let length = -1;
        try {
          length = parseInt(args[3], 10);
        } catch (e) {
          // Ignore
        }

        if (length < 0) {
          this.usage();
          return;
        }

        this.motionblur(image, length);
      } else {
        this.usage();
      }

      this.write(image, outputFile);
    } catch (e) {
      console.error(e);
    }
  }

  private usage(): void {
    console.log(
      'USAGE: <in-file> <out-file> <grayscale|invert|emboss|motionblur> {mb-length}'
    );
  }

  private motionblur(image: Image, length: number): void {
    if (length < 1) {
      return;
    }
    for (let x = 0; x < image.getWidth(); ++x) {
      for (let y = 0; y < image.getHeight(); ++y) {
        const curColor = image.get(x, y);

        const maxX = Math.min(image.getWidth() - 1, x + length - 1);
        for (let i = x + 1; i <= maxX; ++i) {
          const tmpColor = image.get(i, y);
          curColor.red += tmpColor.red;
          curColor.green += tmpColor.green;
          curColor.blue += tmpColor.blue;
        }

        const delta = maxX - x + 1;
        curColor.red = Math.floor(curColor.red / delta); // Ensure integer division
        curColor.green = Math.floor(curColor.green / delta); // Ensure integer division
        curColor.blue = Math.floor(curColor.blue / delta); // Ensure integer division
      }
    }
  }

  private invert(image: Image): void {
    for (let x = 0; x < image.getWidth(); ++x) {
      for (let y = 0; y < image.getHeight(); ++y) {
        const curColor = image.get(x, y);

        curColor.red = 255 - curColor.red;
        curColor.green = 255 - curColor.green;
        curColor.blue = 255 - curColor.blue;
      }
    }
  }

  private grayscale(image: Image): void {
    for (let x = 0; x < image.getWidth(); ++x) {
      for (let y = 0; y < image.getHeight(); ++y) {
        const curColor = image.get(x, y);
        const grayLevel = Math.floor(
          (curColor.red + curColor.green + curColor.blue) / 3
        ); // Ensure integer division
        curColor.red = grayLevel;
        curColor.green = grayLevel;
        curColor.blue = grayLevel;
      }
    }
  }

  private emboss(image: Image): void {
    for (let x = image.getWidth() - 1; x >= 0; --x) {
      for (let y = image.getHeight() - 1; y >= 0; --y) {
        const curColor = image.get(x, y);
        let diff = 0;
        if (x > 0 && y > 0) {
          const upLeftColor = image.get(x - 1, y - 1);
          diff = Math.max(
            Math.abs(curColor.red - upLeftColor.red),
            Math.abs(curColor.green - upLeftColor.green),
            Math.abs(curColor.blue - upLeftColor.blue)
          );
        }
        const grayLevel = Math.min(Math.max(128 + diff, 0), 255);
        curColor.red = grayLevel;
        curColor.green = grayLevel;
        curColor.blue = grayLevel;
      }
    }
  }

  private read(filePath: string): Image {
    const data = fs.readFileSync(filePath, 'utf-8');
    const lines = data.split(/\s+/);

    if (lines[0] !== 'P3') {
        throw new Error('Invalid PPM file format. Expected P3 format.');
    }
    const width = parseInt(lines[1], 10);
    const height = parseInt(lines[2], 10);
    const maxColorValue = parseInt(lines[3], 10);

    const image = new Image(width, height);
    let pixelIndex = 4; // Start reading pixel data after the header

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const color = new Color();
            color.red = parseInt(lines[pixelIndex], 10);
            color.green = parseInt(lines[pixelIndex + 1], 10);
            color.blue = parseInt(lines[pixelIndex + 2], 10);
            image.set(x, y, color);
            pixelIndex += 3; // Move to the next pixel
        }
    }

    return image;
  }

  private write(image: Image, filePath: string): void {
    const output: string[] = [];
    output.push('P3');
    output.push(`${image.getWidth()} ${image.getHeight()}`);
    output.push('255');
    for (let y = 0; y < image.getHeight(); ++y) {
      const row = [];
      for (let x = 0; x < image.getWidth(); ++x) {
        const color = image.get(x, y);
        row.push(`${color.red} ${color.green} ${color.blue}`);
      }
      output.push(row.join(' '));
    }
    fs.writeFileSync(filePath, output.join('\n'), 'utf-8');
  }
}

// Start the program by calling main function
ImageEditor.main(process.argv.slice(2));
