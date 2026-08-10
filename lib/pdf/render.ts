import puppeteer from "puppeteer-core";

function chromePath(): string {
  return (
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    "/usr/local/bin/google-chrome"
  );
}

/**
 * Render a self-contained HTML string to a PDF buffer using a headless Chrome.
 * Uses setContent (no navigation), so no auth/session forwarding is required.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
