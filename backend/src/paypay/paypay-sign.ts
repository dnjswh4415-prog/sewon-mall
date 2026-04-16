import crypto from 'crypto';

export function buildPayPayAuthHeader(params: {
  apiKey: string;
  apiSecret: string;
  requestUri: string;
  method: string;
  body?: string;
  contentType?: string;
}) {
  const nonce = crypto.randomBytes(8).toString('hex');
  const epoch = Math.floor(Date.now() / 1000).toString();

  const hasBody = !!params.body;
  const contentType = hasBody
    ? params.contentType || 'application/json;charset=UTF-8'
    : 'empty';

  const hash = hasBody
    ? crypto
        .createHash('md5')
        .update(contentType)
        .update(params.body!)
        .digest('base64')
    : 'empty';

  const dataToSign = [
    params.requestUri,
    params.method.toUpperCase(),
    nonce,
    epoch,
    contentType,
    hash,
  ].join('\n');

  const mac = crypto
    .createHmac('sha256', params.apiSecret)
    .update(dataToSign)
    .digest('base64');

  return {
    authorization: `hmac OPA-Auth:${params.apiKey}:${mac}:${nonce}:${epoch}:${hash}`,
    contentType,
  };
}