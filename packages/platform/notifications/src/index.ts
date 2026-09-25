export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type NotificationPort = {
  sendEmail(message: EmailMessage): Promise<void>;
  sendSms(to: string, text: string): Promise<void>;
};
