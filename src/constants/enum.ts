import { Gender, JobLevel, JobType, Role } from "@prisma/client";

export const ROLE_ARRAY = Object.values(Role) as [string, ...string[]];

export const GENDER_ARRAY = Object.values(Gender) as [string, ...string[]];

export const JOB_TYPE_ARRAY = Object.values(JobType) as [JobType, ...JobType[]];

export const JOB_LEVEL_ARRAY = Object.values(JobLevel) as [
  JobLevel,
  ...JobLevel[],
];
