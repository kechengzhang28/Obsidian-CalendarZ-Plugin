/**
 * Services layer for CalendarZ plugin
 * Provides business logic services organized by domain:
 * - notes: Note counting and statistics
 * - todos: Todo status detection
 * - dailyNote: Daily note integration
 * - weekNote: Week note management
 * - monthNote: Month note management
 * - yearNote: Year note management
 */

export { NoteCounter } from "./notes/NoteCounter";
export { TodoService } from "./todos/TodoService";
export { DailyNoteService } from "./dailyNote/DailyNoteService";
export { WeekNoteService } from "./weekNote/WeekNoteService";
export { MonthNoteService } from "./monthNote/MonthNoteService";
export { YearNoteService } from "./yearNote/YearNoteService";
