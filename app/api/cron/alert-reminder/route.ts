import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getUserNotificationDetails } from "@/lib/notification";
import { type SendNotificationRequest } from "@farcaster/frame-sdk";

const redis = Redis.fromEnv();
const appUrl = process.env.NEXT_PUBLIC_URL || "";

interface AlertPreference {
  enabled: boolean;
  token?: string;
  url?: string;
  baseName: string;
  expiryDate: string;
  lastNotificationSent?: string;
}

/**
 * Send notifications directly with token & url
 */
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

/**
 * Helper function to check if we should send notification based on expiry date
 */
function shouldSendNotification(expiryDateStr: string): {
  shouldSend: boolean;
  message: string;
} {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(expiryDateStr);
    expiryDate.setHours(0, 0, 0, 0);

    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    console.log(`Expiry date: ${expiryDateStr}, Days difference: ${daysDiff}`);

    if (daysDiff === 1) {
      return {
        shouldSend: true,
        message: `expires tomorrow. renew it soon to avoid losing it.`,
      };
    } else if (daysDiff === 0) {
      return {
        shouldSend: true,
        message: `expires today! renew immediately to avoid losing it.`,
      };
    } else {
      return {
        shouldSend: false,
        message: `Not sending notification: ${daysDiff} days until expiry.`,
      };
    }
  } catch (error) {
    console.error("Error calculating date difference:", error);
    return { shouldSend: false, message: "Error calculating expiry date" };
  }
}

/**
 * Check if notification was already sent today
 */
function alreadySentToday(lastNotificationSent: string | undefined): boolean {
  if (!lastNotificationSent) return false;

  const lastSent = new Date(lastNotificationSent);
  const today = new Date();

  return (
    lastSent.getFullYear() === today.getFullYear() &&
    lastSent.getMonth() === today.getMonth() &&
    lastSent.getDate() === today.getDate()
  );
}

/**
 * Process all alert notifications
 */
async function processAlertNotifications() {
  try {
    const reminderKeys = await redis.keys("alert:*");
    const notificationsSent = [];
    const skippedNotifications = [];
    const errors = [];

    console.log(`Found ${reminderKeys.length} alert keys to process`);

    for (const key of reminderKeys) {
      try {
        const fid = parseInt(key.split(":")[1]);
        console.log(`Processing alert for FID: ${fid}, Key: ${key}`);

        const preference = await redis.get<AlertPreference>(key);

        if (!preference) {
          console.error(`Invalid preference data for key: ${key}`);
          errors.push({ key, error: "Invalid preference data" });
          continue;
        }

        if (!preference.enabled) {
          console.log(`Alerts disabled for FID: ${fid}, skipping`);
          skippedNotifications.push({ fid, reason: "Alerts disabled" });
          continue;
        }

        const { shouldSend, message } = shouldSendNotification(
          preference.expiryDate,
        );

        if (!shouldSend) {
          console.log(`Skipping notification for FID: ${fid}, ${message}`);
          skippedNotifications.push({ fid, reason: message });
          continue;
        }

        if (alreadySentToday(preference.lastNotificationSent)) {
          console.log(
            `Already sent notification today for FID: ${fid}, skipping`,
          );
          skippedNotifications.push({ fid, reason: "Already notified today" });
          continue;
        }

        let notificationSent = false;

        if (preference.token && preference.url) {
          console.log(
            `Attempting to send notification using preference token for FID: ${fid}`,
          );
          notificationSent = await sendDirectNotification({
            token: preference.token,
            url: preference.url,
            title: "Basename Renewal Alert",
            body: `${preference.baseName}.base.eth ${message}`,
          });

          if (notificationSent) {
            console.log(
              `✅ Notification sent using preference token for FID: ${fid}`,
            );
          } else {
            console.warn(
              `❌ Failed to send notification with preference token for FID: ${fid}`,
            );
          }
        } else {
          console.log(`No token/url in preference for FID: ${fid}`);
        }

        if (!notificationSent) {
          console.log(
            `Attempting fallback with notification service for FID: ${fid}`,
          );
          const notificationDetails = await getUserNotificationDetails(fid);

          if (notificationDetails?.token && notificationDetails?.url) {
            notificationSent = await sendDirectNotification({
              token: notificationDetails.token,
              url: notificationDetails.url,
              title: "Basename Renewal Alert",
              body: `${preference.baseName}.base.eth ${message}`,
            });

            if (notificationSent) {
              console.log(
                `✅ Notification sent using notification service for FID: ${fid}`,
              );
            } else {
              console.warn(
                `❌ Failed to send notification via notification service for FID: ${fid}`,
              );
            }
          } else {
            console.warn(`⚠️ No notification details found for FID: ${fid}`);
          }
        }

        if (notificationSent) {
          await redis.set(key, {
            ...preference,
            lastNotificationSent: new Date().toISOString(),
          });

          console.log(`📝 Updated lastNotificationSent for FID: ${fid}`);
          notificationsSent.push(fid);
        }
      } catch (error) {
        console.error(`❌ Error processing alert for key ${key}:`, error);
        errors.push({
          key,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const result = {
      success: true,
      notificationsSentCount: notificationsSent.length,
      notificationsSent,
      skippedCount: skippedNotifications.length,
      skipped: skippedNotifications,
      errorsCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`✅ Processing completed. Results:`, result);
    return result;
  } catch (error) {
    console.error("❌ Error in alert notification processor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handle GET requests (Vercel Cron job triggers)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Unauthorized cron job request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processAlertNotifications();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in basename alert cron job:", error);
    return NextResponse.json(
      { error: "Failed to process alert notifications" },
      { status: 500 },
    );
  }
}

/**
 * Handle POST requests (manual triggers with same auth)
 */
export async function POST(request: Request) {
  return GET(request);
}
