import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { Campaign } from "./types";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("[Notifications] Must use physical device");
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Schedule deadline reminders for a campaign.
 * Schedules at 7d, 3d, 1d, and day-of deadline.
 */
export async function scheduleDeadlineReminders(campaign: Campaign): Promise<string[]> {
  if (!campaign.deadline) return [];

  const deadlineDate = new Date(campaign.deadline);
  const now = new Date();
  const ids: string[] = [];

  const reminders = [
    { daysBefore: 7, title: `${campaign.name} - 7 days left`, body: `Deadline: ${campaign.deadline}. Check your remaining tasks.` },
    { daysBefore: 3, title: `${campaign.name} - 3 days left`, body: `Hurry! Only 3 days until deadline. Complete your tasks.` },
    { daysBefore: 1, title: `${campaign.name} - Tomorrow!`, body: `Final day tomorrow. Make sure all tasks are done.` },
    { daysBefore: 0, title: `${campaign.name} - Today!`, body: `Deadline is today. Last chance to complete tasks.` },
  ];

  for (const reminder of reminders) {
    const triggerDate = new Date(deadlineDate);
    triggerDate.setDate(triggerDate.getDate() - reminder.daysBefore);
    triggerDate.setHours(9, 0, 0, 0); // 9:00 AM

    if (triggerDate <= now) continue; // Skip past dates

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          data: { campaignId: campaign.id, type: "deadline" },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      ids.push(id);
    } catch (error) {
      console.warn(`[Notifications] Failed to schedule: ${reminder.title}`, error);
    }
  }

  return ids;
}

/**
 * Cancel all scheduled notifications for a campaign
 */
export async function cancelCampaignReminders(campaignId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    const data = notification.content.data as { campaignId?: string } | undefined;
    if (data?.campaignId === campaignId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get count of pending notifications
 */
export async function getPendingCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
