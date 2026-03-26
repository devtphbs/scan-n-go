// Barcode Generation and Validation Utilities

/**
 * Generate EAN-13 checksum digit
 * @param {string} digits - 12 digits string
 * @returns {number} checksum digit
 */
function calculateEAN13Checksum(digits) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(digits[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    return (10 - (sum % 10)) % 10;
}

/**
 * Generate unique EAN-13 barcode
 * @returns {string} 13-digit EAN-13 barcode
 */
function generateEAN13Barcode() {
    // Generate 12 random digits
    let digits = '';
    for (let i = 0; i < 12; i++) {
        digits += Math.floor(Math.random() * 10).toString();
    }
    
    // Calculate checksum
    const checksum = calculateEAN13Checksum(digits);
    
    return digits + checksum.toString();
}

/**
 * Validate EAN-13 barcode
 * @param {string} barcode - 13-digit barcode
 * @returns {boolean} true if valid
 */
function validateEAN13Barcode(barcode) {
    if (!/^\d{13}$/.test(barcode)) return false;
    
    const digits = barcode.substring(0, 12);
    const checksum = parseInt(barcode[12]);
    const calculatedChecksum = calculateEAN13Checksum(digits);
    
    return checksum === calculatedChecksum;
}

/**
 * Generate barcode image using JsBarcode
 * @param {string} barcode - barcode number
 * @param {string} canvasId - canvas element ID
 */
function generateBarcodeImage(barcode, canvasId) {
    try {
        JsBarcode(`#${canvasId}`, barcode, {
            format: "EAN13",
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 14,
            margin: 10
        });
    } catch (error) {
        console.error('Error generating barcode:', error);
    }
}

/**
 * Play beep sound (for successful scan)
 */
function playBeep() {
    try {
        // Create audio context for beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000; // 1000 Hz tone
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Could not play beep sound:', error);
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateEAN13Barcode,
        validateEAN13Barcode,
        generateBarcodeImage,
        playBeep
    };
}
