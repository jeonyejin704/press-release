import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/enums";

export type NotificationPayload = {
  userId: string;
  pressRequestId?: string;
  type: NotificationType;
  title: string;
  message: string;
};

export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

// Abstraction so email (SMTP / Microsoft Graph) can be added later without
// touching call sites. In-app notifications always work.
export interface NotificationService {
  sendInAppNotification(payload: NotificationPayload): Promise<void>;
  sendEmailNotification?(payload: EmailPayload): Promise<void>;
}

class DefaultNotificationService implements NotificationService {
  async sendInAppNotification(payload: NotificationPayload): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        pressRequestId: payload.pressRequestId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
      },
    });
    // If an email provider is configured, also send an email. Never throw:
    // in-app delivery is the source of truth.
    if (process.env.NOTIFICATION_EMAIL_PROVIDER && process.env.NOTIFICATION_EMAIL_PROVIDER !== "none") {
      try {
        // TODO: look up user email + dispatch via SMTP / Graph adapter.
      } catch (e) {
        console.warn("[notifications] email dispatch failed (ignored):", e);
      }
    }
  }
}

export const notifications: NotificationService = new DefaultNotificationService();

// Convenience helper used by API routes.
export async function notify(payload: NotificationPayload) {
  return notifications.sendInAppNotification(payload);
}
