import { Redis } from "@upstash/redis";
import {
  setUserNotificationDetails,
  getUserNotificationDetails,
} from "@/lib/notification";
import { type SendNotificationRequest } from "@farcaster/frame-sdk";

const redis = Redis.fromEnv();

interface BaseNameAlertPreference {
  enabled: boolean;
  token?: string;
  url?: string;
  baseName: string;
  expiryDate: string;
}

const appUrl = process.env.NEXT_PUBLIC_URL || "";

function getUserBaseNameAlertKey(fid: number, baseName: string): string {
  return `alert:${fid}:${baseName}`;
}

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
    console.error("Error sending direct notification:", error);
    return false;
  }
}

export async function POST(request: Request) {
  const fid = request.headers.get("X-Farcaster-FID");

  if (!fid) {
    return Response.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    const { enabled, token, url, baseName, expiryDate } = await request.json();

    if (!baseName) {
      return Response.json({ error: "Basename is required" }, { status: 400 });
    }

    if (typeof enabled !== "boolean") {
      return Response.json(
        { error: "enabled must be a boolean" },
        { status: 400 },
      );
    }

    if (enabled && !expiryDate) {
      return Response.json(
        { error: "Expiry date is required when enabling alerts" },
        { status: 400 },
      );
    }

    const preference: BaseNameAlertPreference = {
      enabled,
      baseName,
      expiryDate,
    };

    if (enabled && token && url) {
      preference.token = token;
      preference.url = url;

      await setUserNotificationDetails(parseInt(fid), { token, url });
    }

    await redis.set(
      getUserBaseNameAlertKey(parseInt(fid), baseName),
      preference,
    );

    let notificationSent = false;

    if (preference.token && preference.url) {
      notificationSent = await sendDirectNotification({
        token: preference.token,
        url: preference.url,
        title: "Basenames Frame Alert",
        body: `${baseName} Alert has been set`,
      });

      console.log("notification response: ", notificationSent);

      if (notificationSent) {
        console.log(`Notification sent using preference token for FID ${fid}`);
      } else {
        console.log(
          `Failed to send notification with preference token for FID ${fid}`,
        );
      }

      if (!notificationSent) {
        // Get notification details from the notification system
        const notificationDetails = await getUserNotificationDetails(parseInt(fid));

        if (notificationDetails?.token && notificationDetails?.url) {
          notificationSent = await sendDirectNotification({
            token: notificationDetails.token,
            url: notificationDetails.url,
            title: "Daily Meditation Reminder",
            body: "Take a moment to breathe and center yourself with a meditation session.",
          });

          console.log("notification response: ", notificationSent);

          if (notificationSent) {
            console.log(
              `Notification sent using notification service for FID ${fid}`,
            );
          } else {
            console.warn(
              `Failed to send notification via notification service for FID ${fid}`,
            );
          }
        } else {
          console.warn(`No notification details found for FID ${fid}`);
        }
      }
    }

    return Response.json({ success: true, preference });
  } catch (error) {
    console.error("Error updating basename alert preferences: ", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
