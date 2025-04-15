export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;

  return Response.json({
    accountAssociation: {
      header:
        "eyJmaWQiOjU4NzYxNSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEJlQjVGZEJEMTcxYkE3YTdmODY1ZDg0NDJERTBiNDI1QUNhZmVDOTcifQ",
      payload: "eyJkb21haW4iOiJiYXNlbmFtZS1taW5pLnZlcmNlbC5hcHAifQ",
      signature:
        "MHhiM2RmNmU3NWY0NDE4OGFhY2YyMzkzZWQ2MGEyOWUxMDRiMDcyMmI1NzliYzVmNjE3Zjk1OTRkZmExMDFiZjc5MDQ5ZjI4Y2ViYzU4ZGQyNjgwYWY3MTcyMWZmNDQxMmFhYmRmMmY4NGI4ZGMwYjgyMTgxNTJjOWNiMWU2NTM2YjFi",
    },
    frame: {
      version: process.env.NEXT_PUBLIC_VERSION,
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      homeUrl: URL,
      iconUrl: process.env.NEXT_PUBLIC_ICON_URL,
      imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL,
      buttonTitle: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
      splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL,
      splashBackgroundColor: `#${process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR}`,
      webhookUrl: `${URL}/api/webhook`,
    },
  });
}
