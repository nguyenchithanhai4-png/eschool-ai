const path = require('path');
const mammoth = require('mammoth');

// Polyfills for pdf-parse (Node.js compatibility)
if (!global.DOMMatrix) global.DOMMatrix = class DOMMatrix { };
if (!global.ImageData) global.ImageData = class ImageData { };
if (!global.Path2D) global.Path2D = class Path2D { };

const pdfParse = require('pdf-parse');

// Document Parser Module
// Extract text from Buffer based on file type

const extractText = async (fileBuffer, mimeType, fileName) => {
    try {
        console.log(`[DocumentParser] Processing file: ${fileName} (${mimeType})`);

        // 1. PDF Handling
        if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
            const data = await pdfParse(fileBuffer);
            return data.text;
        }

        // 2. Word Handling (.docx)
        if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileName.toLowerCase().endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value;
        }

        // 3. Image OCR (Placeholder - can be integrated with Tesseract.js if needed)
        if (mimeType.startsWith('image/')) {
            // Note: Currently server.js handles images via AI Vision (Ollama/Gemini).
            // This module focuses on Document parsing. 
            // If local OCR is strictly required here, install tesseract.js
            return "[IMAGE CONTENT - Handled by Vision AI]";
        }

        // 4. Plain Text
        if (mimeType === 'text/plain' || fileName.toLowerCase().endsWith('.txt')) {
            return fileBuffer.toString('utf8');
        }

        throw new Error('Unsupported file type: ' + mimeType);

    } catch (error) {
        console.error('[DocumentParser] Error extracting text:', error.message);
        throw error;
    }
};

module.exports = { extractText };
