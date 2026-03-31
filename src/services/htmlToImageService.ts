/**
 * HTML to Image Service
 * Converts HTML receipt templates to PNG images for printing
 */

import * as htmlToImage from 'html-to-image';

export interface HtmlToImageOptions {
  width: number;
  height?: number;
  backgroundColor?: string;
  quality?: number;
}

/**
 * Convert HTML string to PNG data URL
 */
export async function convertHtmlToPng(
  htmlContent: string,
  options: HtmlToImageOptions = { width: 576 }
): Promise<string> {
  const {
    width = 576,
    height,
    backgroundColor = '#ffffff',
    quality = 1.0,
  } = options;

  try {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${width}px`;
    if (height) {
      container.style.height = `${height}px`;
    }
    container.innerHTML = htmlContent;

    // Append to body
    document.body.appendChild(container);

    // Wait for fonts to load
    await document.fonts.ready;

    // Wait a bit for images to load (if any)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert to PNG
    const dataUrl = await htmlToImage.toPng(container, {
      width,
      height: height || container.scrollHeight,
      backgroundColor,
      quality,
      pixelRatio: 2, // Higher quality for printing
      cacheBust: true,
    });

    // Cleanup
    document.body.removeChild(container);

    return dataUrl;
  } catch (error) {
    console.error('Failed to convert HTML to image:', error);
    throw new Error('فشل تحويل الإيصال إلى صورة');
  }
}

/**
 * Convert HTML string to PNG Blob
 */
export async function convertHtmlToBlob(
  htmlContent: string,
  options: HtmlToImageOptions = { width: 576 }
): Promise<Blob> {
  const {
    width = 576,
    height,
    backgroundColor = '#ffffff',
    quality = 1.0,
  } = options;

  let container: HTMLElement | null = null;

  try {
    console.log('🔄 Creating HTML container...');

    // Create a temporary container
    container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${width}px`;
    if (height) {
      container.style.height = `${height}px`;
    }

    console.log('📝 Setting HTML content...');
    container.innerHTML = htmlContent;

    // Append to body
    console.log('➕ Appending to document body...');
    document.body.appendChild(container);

    // Wait for fonts to load
    console.log('⏳ Waiting for fonts to load...');
    await document.fonts.ready;
    console.log('✅ Fonts loaded');

    // Wait for images to load (if any)
    console.log('⏳ Waiting for render (500ms)...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✅ Render complete');

    // Get actual dimensions
    const actualHeight = height || container.scrollHeight;
    console.log(`📐 Dimensions: ${width}x${actualHeight}px`);

    // Convert to Blob
    console.log('🖼️ Converting to image blob...');
    const blob = await htmlToImage.toBlob(container, {
      width,
      height: actualHeight,
      backgroundColor,
      quality,
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: false,
    });

    console.log('✅ Blob created:', blob?.size, 'bytes');

    if (!blob) {
      throw new Error('html-to-image returned null blob');
    }

    return blob;
  } catch (error: any) {
    console.error('❌ Failed to convert HTML to blob:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`فشل تحويل HTML إلى صورة: ${error.message}`);
  } finally {
    // Always cleanup
    if (container && container.parentNode) {
      console.log('🧹 Cleaning up container...');
      document.body.removeChild(container);
    }
  }
}

/**
 * Convert data URL to Buffer for Electron
 */
export function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64Data = dataUrl.split(',')[1];
  return Buffer.from(base64Data, 'base64');
}

/**
 * Convert Blob to ArrayBuffer
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to array buffer'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Preview receipt HTML in a new window
 */
export function previewReceiptHtml(htmlContent: string): void {
  const previewWindow = window.open('', '_blank', 'width=600,height=800');
  if (previewWindow) {
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
  } else {
    alert('يرجى السماح بالنوافذ المنبثقة لمعاينة الإيصال');
  }
}

/**
 * Download receipt as PNG image
 */
export async function downloadReceiptAsPng(
  htmlContent: string,
  filename: string = 'receipt.png',
  options: HtmlToImageOptions = { width: 576 }
): Promise<void> {
  try {
    const dataUrl = await convertHtmlToPng(htmlContent, options);

    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to download receipt:', error);
    throw error;
  }
}
