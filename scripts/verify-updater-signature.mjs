import { createHash, createPublicKey, verify } from 'node:crypto';

/** 验证 Tauri/minisign 的预哈希 Ed25519 包签名及受信注释；只接收公钥。 */
export function verifyUpdaterSignature(data, encodedSignature, encodedPublicKey) {
  const publicLines = Buffer.from(encodedPublicKey.trim(), 'base64').toString('utf8').trim().split(/\r?\n/);
  const signatureLines = Buffer.from(encodedSignature.trim(), 'base64').toString('utf8').trim().split(/\r?\n/);
  if (publicLines.length !== 2 || signatureLines.length !== 4 || !signatureLines[2].startsWith('trusted comment: ')) {
    throw new Error('Invalid updater signature format');
  }
  const publicData = Buffer.from(publicLines[1], 'base64');
  const signatureData = Buffer.from(signatureLines[1], 'base64');
  if (publicData.length !== 42 || signatureData.length !== 74 || publicData.subarray(0, 2).toString() !== 'Ed'
    || signatureData.subarray(0, 2).toString() !== 'ED' || !publicData.subarray(2, 10).equals(signatureData.subarray(2, 10))) {
    throw new Error('Updater signing key or algorithm mismatch');
  }
  const key = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), publicData.subarray(10)]), format: 'der', type: 'spki' });
  const signature = signatureData.subarray(10);
  const prehash = createHash('blake2b512').update(data).digest();
  const comment = signatureLines[2].slice('trusted comment: '.length);
  if (!verify(null, prehash, key, signature)
    || !verify(null, Buffer.concat([signature, Buffer.from(comment)]), key, Buffer.from(signatureLines[3], 'base64'))) {
    throw new Error('Updater signature verification failed');
  }
}
