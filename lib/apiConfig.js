const defaultUrl = 'https://erp-printing-back-end.onrender.com';
const rawUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
export const API_BASE_URL = (rawUrl || '').replace(/\/+$/, '');

 