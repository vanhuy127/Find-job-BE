import { Gender, JobLevel, JobType, Role } from "@prisma/client";

export const ROLE_ARRAY = Object.values(Role) as [string, ...string[]];

export const GENDER_ARRAY = Object.values(Gender) as [string, ...string[]];

export const JOB_TYPE_ARRAY = Object.values(JobType) as [JobType, ...JobType[]];

export const JOB_LEVEL_ARRAY = Object.values(JobLevel) as [
  JobLevel,
  ...JobLevel[],
];

export const VIP_PACKAGE_LEVEL: Record<string, number> = {
  BASIC: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
  DIAMOND: 4,
};

export const VIP_PACKAGE_LEVEL_ARRAY = [
  "BASIC",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
] as const;
