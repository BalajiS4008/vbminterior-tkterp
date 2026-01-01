import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { TimeEntry, TimeEntryFilters, TimesheetSummary } from '../types';

const COLLECTION_NAME = 'timeEntries';

// Helper to convert Firestore timestamps to Date
const convertTimestamps = (data: any): TimeEntry => ({
  ...data,
  date: data.date?.toDate?.() || new Date(data.date),
  approvedAt: data.approvedAt?.toDate?.() || data.approvedAt,
  createdAt: data.createdAt?.toDate?.() || new Date(),
  updatedAt: data.updatedAt?.toDate?.() || new Date(),
});

// Helper to calculate duration in minutes from start and end time
export const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return Math.max(0, endMinutes - startMinutes);
};

// Helper to format duration for display
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const timeEntryService = {
  // Get all time entries with optional filters
  async getAll(filters?: TimeEntryFilters): Promise<{ entries: TimeEntry[]; total: number }> {
    try {
      let q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));

      const snapshot = await getDocs(q);
      let entries = snapshot.docs.map((d) => ({
        ...convertTimestamps(d.data()),
        id: d.id,
      }));

      // Apply filters in memory
      if (filters) {
        if (filters.userId) {
          entries = entries.filter((e) => e.userId === filters.userId);
        }
        if (filters.projectId) {
          entries = entries.filter((e) => e.projectId === filters.projectId);
        }
        if (filters.ticketId) {
          entries = entries.filter((e) => e.ticketId === filters.ticketId);
        }
        if (filters.status && filters.status.length > 0) {
          entries = entries.filter((e) => filters.status!.includes(e.status));
        }
        if (filters.billable !== undefined) {
          entries = entries.filter((e) => e.billable === filters.billable);
        }
        if (filters.dateRange) {
          const { start, end } = filters.dateRange;
          entries = entries.filter((e) => {
            const date = new Date(e.date);
            return date >= start && date <= end;
          });
        }
      }

      return { entries, total: entries.length };
    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }
  },

  // Get time entry by ID
  async getById(id: string): Promise<TimeEntry | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return {
        ...convertTimestamps(docSnap.data()),
        id: docSnap.id,
      };
    } catch (error) {
      console.error('Error fetching time entry:', error);
      throw error;
    }
  },

  // Get entries by user and date range (for timesheet)
  async getByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeEntry[]> {
    try {
      // Simple query without orderBy to avoid requiring composite index
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs
        .map((d) => ({
          ...convertTimestamps(d.data()),
          id: d.id,
        }))
        .filter((e) => {
          const date = new Date(e.date);
          return date >= startDate && date <= endDate;
        })
        // Sort in memory instead of using orderBy
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return entries;
    } catch (error) {
      console.error('Error fetching user time entries:', error);
      throw error;
    }
  },

  // Get timesheet summary for a week
  async getTimesheetSummary(userId: string, weekStartDate: Date): Promise<TimesheetSummary> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const entries = await this.getByUserAndDateRange(userId, weekStartDate, weekEndDate);

    // Group entries by date
    const entriesByDate: Record<string, TimeEntry[]> = {};
    let totalMinutes = 0;
    let billableMinutes = 0;

    entries.forEach((entry) => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = [];
      }
      entriesByDate[dateKey].push(entry);
      totalMinutes += entry.duration;
      if (entry.billable) {
        billableMinutes += entry.duration;
      }
    });

    // Determine overall status
    let status: 'draft' | 'submitted' | 'approved' | 'rejected' = 'draft';
    if (entries.length > 0) {
      const allApproved = entries.every((e) => e.status === 'approved');
      const allSubmitted = entries.every((e) => e.status === 'submitted' || e.status === 'approved');
      const anyRejected = entries.some((e) => e.status === 'rejected');

      if (allApproved) status = 'approved';
      else if (anyRejected) status = 'rejected';
      else if (allSubmitted) status = 'submitted';
    }

    return {
      userId,
      userName: entries[0]?.userName || '',
      weekStartDate,
      weekEndDate,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      billableHours: Math.round((billableMinutes / 60) * 100) / 100,
      nonBillableHours: Math.round(((totalMinutes - billableMinutes) / 60) * 100) / 100,
      entriesByDate,
      status,
    };
  },

  // Create new time entry
  async create(
    data: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TimeEntry> {
    try {
      const now = Timestamp.now();
      const docData = {
        ...data,
        date: Timestamp.fromDate(new Date(data.date)),
        approvedAt: data.approvedAt ? Timestamp.fromDate(new Date(data.approvedAt)) : null,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

      return {
        id: docRef.id,
        ...data,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      };
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  },

  // Update time entry
  async update(id: string, data: Partial<TimeEntry>): Promise<TimeEntry> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      // Convert dates to Timestamps
      if (data.date) {
        updateData.date = Timestamp.fromDate(new Date(data.date));
      }
      if (data.approvedAt) {
        updateData.approvedAt = Timestamp.fromDate(new Date(data.approvedAt));
      }

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(docRef, updateData);

      const updated = await this.getById(id);
      if (!updated) throw new Error('Time entry not found after update');

      return updated;
    } catch (error) {
      console.error('Error updating time entry:', error);
      throw error;
    }
  },

  // Delete time entry
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting time entry:', error);
      throw error;
    }
  },

  // Submit time entries for approval
  async submitForApproval(ids: string[]): Promise<void> {
    try {
      const updatePromises = ids.map((id) =>
        this.update(id, { status: 'submitted' })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error submitting time entries:', error);
      throw error;
    }
  },

  // Approve time entries
  async approve(ids: string[], approvedBy: string): Promise<void> {
    try {
      const updatePromises = ids.map((id) =>
        this.update(id, {
          status: 'approved',
          approvedBy,
          approvedAt: new Date(),
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error approving time entries:', error);
      throw error;
    }
  },

  // Reject time entries
  async reject(ids: string[]): Promise<void> {
    try {
      const updatePromises = ids.map((id) =>
        this.update(id, { status: 'rejected' })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error rejecting time entries:', error);
      throw error;
    }
  },

  // Get total hours for a project
  async getProjectHours(projectId: string): Promise<{ total: number; billable: number }> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('projectId', '==', projectId)
      );

      const snapshot = await getDocs(q);
      let totalMinutes = 0;
      let billableMinutes = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalMinutes += data.duration || 0;
        if (data.billable) {
          billableMinutes += data.duration || 0;
        }
      });

      return {
        total: Math.round((totalMinutes / 60) * 100) / 100,
        billable: Math.round((billableMinutes / 60) * 100) / 100,
      };
    } catch (error) {
      console.error('Error fetching project hours:', error);
      throw error;
    }
  },

  // Get user hours for a date range
  async getUserHours(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ total: number; billable: number }> {
    try {
      const entries = await this.getByUserAndDateRange(userId, startDate, endDate);

      let totalMinutes = 0;
      let billableMinutes = 0;

      entries.forEach((entry) => {
        totalMinutes += entry.duration;
        if (entry.billable) {
          billableMinutes += entry.duration;
        }
      });

      return {
        total: Math.round((totalMinutes / 60) * 100) / 100,
        billable: Math.round((billableMinutes / 60) * 100) / 100,
      };
    } catch (error) {
      console.error('Error fetching user hours:', error);
      throw error;
    }
  },
};

export default timeEntryService;
