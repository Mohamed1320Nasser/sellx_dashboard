/**
 * Type definitions for escpos libraries
 * These are custom type declarations as the packages don't provide official types
 */

declare module 'escpos' {
  class Printer {
    constructor(device: any, options?: {
      encoding?: string;
      width?: number;
    });

    font(type: string): this;
    align(alignment: string): this;
    style(style: string): this;
    size(width: number, height: number): this;
    text(content: string): this;
    feed(lines: number): this;
    cut(): this;
    close(): Promise<void>;
    drawLine(): this;
    barcode(data: string, type: string, options?: {
      width?: number;
      height?: number;
      hri?: boolean;
    }): this;
    qrimage(data: string, options?: {
      type?: string;
      mode?: string;
    }): this;
    image(image: any, density?: string): this;
  }

  namespace Image {
    function load(path: string | Buffer): Promise<any>;
  }

  const escpos: {
    Printer: typeof Printer;
    Image: typeof Image;
  };

  export = escpos;
}

declare module 'escpos-network' {
  export default class Network {
    constructor(address: string, port: number);
    open(): Promise<void>;
    close(): Promise<void>;
  }
}

declare module 'escpos-usb' {
  export default class USB {
    constructor();
    open(): Promise<void>;
    close(): Promise<void>;
  }
}
