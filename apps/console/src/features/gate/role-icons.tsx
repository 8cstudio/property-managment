import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Compass,
  FileCheck,
  HardHat,
  KeyRound,
  Landmark,
  Radar,
  Shield,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react";

export const roleIcons: Record<string, LucideIcon> = {
  "super-admin": Shield,
  "org-admin": Building2,
  operations: Radar,
  property: Landmark,
  lettings: KeyRound,
  compliance: FileCheck,
  finance: Wallet,
  migration: HardHat,
  landlord: Compass,
  tenant: UserRound,
  contractor: Wrench,
};
