import { Redis } from "@upstash/redis";
import { getUserNotificationDetails } from "@/lib/notification";
import { type SendNotificationRequest } from "@farcaster/frame-sdk";

const redis = Redis.fromEnv();
const appUrl = process.env.NEXT_PUBLIC_URL || "";


// send notifications directly with token & url
async function sendDirectNotification({
  token,
  url,
  title,
  body,
}: {
  token: string;
  url: string;
  title: string;
  body: string;
}): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: crypto.randomUUID(),
        title,
        body,
        targetUrl: appUrl,
        tokens: [token],
      } satisfies SendNotificationRequest),
    });

    return response.status === 200;
  } catch (error) {
    console.error("Error sending direct notifications: ", error);
    return false;
  }
}
