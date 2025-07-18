export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export async function collectDeviceMetadata() {
  // Get IP address
  let ip = '';
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    ip = (await res.json()).ip;
  } catch (e) {}

  // Screen resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Language
  const language = navigator.language;

  // OS and browser
  const userAgent = navigator.userAgent;

  // Fonts (best effort)
  let fonts = [];
  try {
    if (document.fonts) {
      fonts = Array.from(document.fonts).map(f => f.family);
    }
  } catch (e) {}

  // Canvas/WebGL fingerprint (best effort)
  let canvasFp = '';
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125,1,62,20);
    ctx.fillStyle = '#069';
    ctx.fillText('device-fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('device-fingerprint', 4, 17);
    canvasFp = canvas.toDataURL();
  } catch (e) {}

  return {
    ip,
    screenResolution,
    timezone,
    language,
    userAgent,
    fonts,
    canvasFp,
    timestamp: new Date().toISOString(),
  };
}
