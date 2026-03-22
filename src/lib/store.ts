export function isStoreOpen() {
  const now = new Date();
  
  // Use a fixed timezone if possible, but for now we'll use the user's local time
  // which is provided in the metadata as -03:00 (Brasilia Time)
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const time = hour + minutes / 60;

  // Monday (1) to Friday (5): 09:00 - 18:30
  if (day >= 1 && day <= 5) {
    return time >= 9 && time < 18.5;
  }
  // Saturday (6): 09:00 - 13:00
  if (day === 6) {
    return time >= 9 && time < 13;
  }
  // Sunday (0): Closed
  return false;
}
