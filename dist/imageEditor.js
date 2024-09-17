"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
class Color {
    red;
    green;
    blue;
    constructor() {
        this.red = 0;
        this.green = 0;
        this.blue = 0;
    }
}
class Image {
    pixels;
    constructor(width, height) {
        this.pixels = Array.from({ length: width }, () => Array.from({ length: height }, () => new Color()));
    }
    getWidth() {
        return this.pixels.length;
    }
    getHeight() {
        return this.pixels[0].length;
    }
    set(x, y, color) {
        this.pixels[x][y] = color;
    }
    get(x, y) {
        return this.pixels[x][y];
    }
}
class ImageEditor {
    static main(args) {
        new ImageEditor().run(args);
    }
    run(args) {
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
            }
            else if (filter === 'invert') {
                if (args.length !== 3) {
                    this.usage();
                    return;
                }
                this.invert(image);
            }
            else if (filter === 'emboss') {
                if (args.length !== 3) {
                    this.usage();
                    return;
                }
                this.emboss(image);
            }
            else if (filter === 'motionblur') {
                if (args.length !== 4) {
                    this.usage();
                    return;
                }
                let length = -1;
                try {
                    length = parseInt(args[3], 10);
                }
                catch (e) {
                    // Ignore
                }
                if (length < 0) {
                    this.usage();
                    return;
                }
                this.motionblur(image, length);
            }
            else {
                this.usage();
            }
            this.write(image, outputFile);
        }
        catch (e) {
            console.error(e);
        }
    }
    usage() {
        console.log('USAGE: ts-node ImageEditor.ts <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}');
    }
    motionblur(image, length) {
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
    invert(image) {
        for (let x = 0; x < image.getWidth(); ++x) {
            for (let y = 0; y < image.getHeight(); ++y) {
                const curColor = image.get(x, y);
                curColor.red = 255 - curColor.red;
                curColor.green = 255 - curColor.green;
                curColor.blue = 255 - curColor.blue;
            }
        }
    }
    grayscale(image) {
        for (let x = 0; x < image.getWidth(); ++x) {
            for (let y = 0; y < image.getHeight(); ++y) {
                const curColor = image.get(x, y);
                const grayLevel = Math.floor((curColor.red + curColor.green + curColor.blue) / 3); // Ensure integer division
                curColor.red = grayLevel;
                curColor.green = grayLevel;
                curColor.blue = grayLevel;
            }
        }
    }
    emboss(image) {
        for (let x = image.getWidth() - 1; x >= 0; --x) {
            for (let y = image.getHeight() - 1; y >= 0; --y) {
                const curColor = image.get(x, y);
                let diff = 0;
                if (x > 0 && y > 0) {
                    const upLeftColor = image.get(x - 1, y - 1);
                    diff = Math.max(Math.abs(curColor.red - upLeftColor.red), Math.abs(curColor.green - upLeftColor.green), Math.abs(curColor.blue - upLeftColor.blue));
                }
                const grayLevel = Math.min(Math.max(128 + diff, 0), 255);
                curColor.red = grayLevel;
                curColor.green = grayLevel;
                curColor.blue = grayLevel;
            }
        }
    }
    read(filePath) {
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
    write(image, filePath) {
        const output = [];
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
//# sourceMappingURL=imageEditor.js.map