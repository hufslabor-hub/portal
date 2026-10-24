import 'server-only';
export const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN ?? process.env.hufslabor_READ_WRITE_TOKEN;
