export class BoldCryptor {
    constructor(key, // 16 bytes for AES-128
    nonce // 13-byte nonce
    ) {
        this.key = key;
        this.nonce = nonce;
        this.counter = 0;
        if (key.length !== 16) {
            throw new Error("Key must be 16 bytes (AES-128)");
        }
        if (nonce.length !== 13) {
            throw new Error("Nonce must be 13 bytes");
        }
    }
    static base64ToUint8Array(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
    static arrayBufferToHex(buffer) {
        const bytes = new Uint8Array(buffer);
        return Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }
    static async random(size) {
        const array = new Uint8Array(size);
        crypto.getRandomValues(array);
        return array;
    }
    async process(bytes) {
        // 3-byte counter allows up to ~16MB per nonce
        const counterBytes = new Uint8Array(3);
        counterBytes[0] = (this.counter >> 16) & 0xff;
        counterBytes[1] = (this.counter >> 8) & 0xff;
        counterBytes[2] = this.counter & 0xff;
        // 13-byte nonce + 3-byte counter = 16-byte IV
        const iv = new Uint8Array(16);
        iv.set(this.nonce, 0);
        iv.set(counterBytes, 13);
        const cryptoKey = await crypto.subtle.importKey("raw", this.key, { name: "AES-CTR" }, false, ["encrypt", "decrypt"]);
        const result = await crypto.subtle.encrypt({
            name: "AES-CTR",
            counter: iv,
            length: 64, // bits of the counter to increment
        }, cryptoKey, bytes);
        this.counter += Math.ceil(bytes.length / 16); // Increment in 16-byte blocks
        return new Uint8Array(result);
    }
}
