import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { downloadFileToBuffer } from './pdf-extract.utils.js';

/**
 * Add watermark to PDF
 * @param pdfPath - Path to PDF file (local or URL)
 * @param options - Watermark options
 * @returns Watermarked PDF as Buffer
 */
export async function addWatermarkToPdf(
  pdfPath: string,
  options: {
    userName?: string;
    downloadDate: Date;
    articleTitle?: string;
  }
): Promise<Buffer> {
  console.log('\n🔖 [Watermark] Starting watermarking process...');
  console.log('📄 [Watermark] PDF path:', pdfPath);
  
  try {
    // 1. Load original PDF
    let pdfBytes: Buffer;
    
    if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
      console.log('🌐 [Watermark] Downloading PDF from URL...');
      pdfBytes = await downloadFileToBuffer(pdfPath);
    } else {
      console.log('💾 [Watermark] Reading PDF from local file...');
      let filePath = pdfPath;
      
      if (pdfPath.startsWith('/uploads')) {
        filePath = path.join(process.cwd(), pdfPath);
      }
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`);
      }
      
      pdfBytes = fs.readFileSync(filePath);
    }
    
    console.log(`✅ [Watermark] PDF loaded successfully (${pdfBytes.length} bytes)`);
    
    // 2. Load PDF document
    console.log('📖 [Watermark] Loading PDF document...');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    console.log(`📄 [Watermark] PDF has ${pages.length} pages`);
    
    // 3. Prepare watermark text
    const dateStr = options.downloadDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const watermarkText = `Downloaded from LAW NATION on ${dateStr}`;
    
    console.log('🔖 [Watermark] Watermark text:', watermarkText);
    
    // 4. Add watermark to each page
    console.log('✍️ [Watermark] Adding watermark to all pages...');
    
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      
      // Bottom-left watermark (footer)
      page.drawText(watermarkText, {
        x: 50,
        y: 30,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),  // Gray color
        opacity: 0.7,
      });
      
      // Top-right watermark (header)
      page.drawText('LAW NATION', {
        x: width - 120,
        y: height - 30,
        size: 12,
        color: rgb(0.7, 0, 0),  // Red color
        opacity: 0.5,
      });
    });
    
    console.log(`✅ [Watermark] Watermark added to ${pages.length} pages`);
    
    // 5. Save watermarked PDF
    console.log('💾 [Watermark] Saving watermarked PDF...');
    const watermarkedBytes = await pdfDoc.save();
    const buffer = Buffer.from(watermarkedBytes);
    
    console.log(`✅ [Watermark] Watermarked PDF created (${buffer.length} bytes)`);
    console.log(`📊 [Watermark] Size increase: ${((buffer.length - pdfBytes.length) / 1024).toFixed(2)} KB`);
    
    return buffer;
  } catch (error: unknown) {
    console.error('❌ [Watermark] Watermarking failed!');
    console.error('❌ [Watermark] Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
