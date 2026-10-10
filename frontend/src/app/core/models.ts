export type Role = 'Admin' | 'General User';
export interface User { userId: string; fullName: string; email: string; department: string; role: Role; active: boolean; createdAt: string; }
export interface VRecord { id: string; candidateName: string; department: string; type: string; assignedTo: string; status: string; createdAt: string; updatedAt: string; }
export interface Page<T> { items: T[]; total: number; page?: number; pageSize?: number; }
export interface Stats { total: number; pending: number; inProgress: number; completed: number; onHold: number; }
export interface Activity { id: string; userId: string; message: string; at: string; }
export const STATUSES = ['Pending', 'In Progress', 'Completed', 'On Hold'];
export const TYPES = ['Employment Verification', 'Education Verification', 'Identity Verification', 'Address Verification'];
