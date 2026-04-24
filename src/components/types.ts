/** Data structure representing note count for a specific date */
export interface DateCount {
	/** Date string in YYYY-MM-DD format */
	date: string;
	/** Number of notes for this date */
	count: number;
}

/** Todo status for a specific date */
export interface DateTodoStatus {
	/** Date string in YYYY-MM-DD format */
	date: string;
	/** Whether the note has any todo items */
	hasTodos: boolean;
	/** Whether all todo items are completed */
	allCompleted: boolean;
}

/** Todo status for a specific week */
export interface WeekTodoStatus {
	/** Week number (e.g., "2024-W01") */
	weekKey: string;
	/** Whether the week note has any todo items */
	hasTodos: boolean;
	/** Whether all todo items are completed */
	allCompleted: boolean;
}
