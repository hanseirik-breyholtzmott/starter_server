import notificationModel, {
  INotificationModel,
} from "../models/notification.model";

const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string = "info"
) => {
  try {
    const notification = new notificationModel({
      userId: userId,
      title: title,
      message: message,
      type: type,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to crate notification");
  }
};

const updateNotificationById = async (id: string, updateData: object) => {
  try {
    const notification = await notificationModel.findByIdAndUpdate(
      { _id: id },
      { $set: updateData }
    );
  } catch (error) {
    console.error("Error updating a notification:", error);
    throw new Error("Failed to update notification");
  }
};

const markAllIsRead = async (userId: string) => {
  try {
    const notifications = await notificationModel.updateMany(
      { userId: userId, read: "unread" },
      { $set: { read: "read" } }
    );
  } catch (error) {
    console.error("Error updating all unread notifications:", error);
    throw new Error("Failed to update all unread notifications");
  }
};

const getNotificationsByUserId = async (
  userId: string
): Promise<INotificationModel[] | null> => {
  try {
    const notifications = await notificationModel
      .find({ userId: userId })
      .sort({ createdAt: -1 }); // Sort by `createdAt` in descending order
    return notifications;
  } catch (error) {
    console.error("Error getting notifications by user id.");
    throw new Error("Failed to getting notifications be user id.");
  }
};

export default {
  createNotification,
  updateNotificationById,
  markAllIsRead,
  getNotificationsByUserId,
};
