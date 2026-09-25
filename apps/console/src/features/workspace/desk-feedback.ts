import { toast } from "@ezzi/ui";

const FLASH_MS = 4500;

export function flashDeskSuccess(message: string) {
  toast.success(message, { duration: FLASH_MS, id: message });
}

export function flashDeskError(message: string) {
  toast.error(message, { duration: FLASH_MS + 500, id: message });
}
