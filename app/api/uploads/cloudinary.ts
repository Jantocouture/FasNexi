// Cloudinary signed upload helper (client-side usage)
// Server is expected to provide a signed payload at /api/uploads/sign

type SignResponse = {
  url: string; // e.g. https://api.cloudinary.com/v1_1/<cloud>/auto/upload
  fields: {
    api_key: string;
    timestamp: string;
    signature: string;
    upload_preset?: string;
    folder?: string;
  };
};

export async function getSignedUpload() {
  const res = await fetch('/api/uploads/sign');
  if (!res.ok) throw new Error('Failed to get signed upload');
  const data: SignResponse = await res.json();
  return data;
}

export async function uploadToCloudinary(file: Blob | File) {
  const sign = await getSignedUpload();
  const form = new FormData();
  // include fields returned by sign endpoint
  Object.entries(sign.fields).forEach(([k, v]) => {
    if (v) form.append(k, v.toString());
  });
  form.append('file', file as Blob);
  const res = await fetch(sign.url, { method: 'POST', body: form });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${txt}`);
  }
  return res.json();
}
