// Blood Type Constants
export const BLOOD_TYPES = {
  WHOLE_BLOOD: 'Whole_blood',
  PRC: 'PRC', 
  LPRC: 'LPRC'
} as const;

// Blood Type Display Names
export const BLOOD_TYPE_LABELS = {
  [BLOOD_TYPES.WHOLE_BLOOD]: 'Whole blood',
  [BLOOD_TYPES.PRC]: 'PRC',
  [BLOOD_TYPES.LPRC]: 'LPRC'
} as const;

// Blood Group Constants
export const BLOOD_GROUPS = {
  A: 'A',
  B: 'B', 
  AB: 'AB',
  O: 'O'
} as const;

// Department Constants
export const DEPARTMENTS = {
  OPD: 'OPD',
  IPD: 'IPD',
  ER: 'ER'
} as const;

// Department Display Names
export const DEPARTMENT_LABELS = {
  [DEPARTMENTS.OPD]: 'OPD (ผู้ป่วยนอก)',
  [DEPARTMENTS.IPD]: 'IPD (ผู้ป่วยใน)',
  [DEPARTMENTS.ER]: 'ER (ห้องฉุกเฉิน)'
} as const;

// Status Constants
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CANCELLED_BY_DISPENSER: 'cancelled_by_dispenser'
} as const;

// Status Display Names
export const RESERVATION_STATUS_LABELS = {
  [RESERVATION_STATUS.PENDING]: 'รอดำเนินการ',
  [RESERVATION_STATUS.APPROVED]: 'อนุมัติแล้ว',
  [RESERVATION_STATUS.REJECTED]: 'ถูกปฏิเสธ',
  [RESERVATION_STATUS.COMPLETED]: 'เสร็จสิ้น',
  [RESERVATION_STATUS.CANCELLED]: 'ยกเลิก',
  [RESERVATION_STATUS.CANCELLED_BY_DISPENSER]: 'ยกเลิกโดยผู้จ่าย'
} as const;

// Type definitions
export type BloodType = typeof BLOOD_TYPES[keyof typeof BLOOD_TYPES];
export type BloodGroup = typeof BLOOD_GROUPS[keyof typeof BLOOD_GROUPS];
export type Department = typeof DEPARTMENTS[keyof typeof DEPARTMENTS];
export type ReservationStatus = typeof RESERVATION_STATUS[keyof typeof RESERVATION_STATUS];