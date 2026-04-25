import { App, Modal, ButtonComponent } from "obsidian";
import type { I18nLike } from "../../core/types";

/**
 * Confirmation modal dialog for creating notes.
 * Displays a message with the target date and Cancel/Create buttons.
 */
export class ConfirmModal extends Modal {
	/** i18n object for translated strings */
	private i18n: I18nLike;
	/** Date string to display in the confirmation message */
	private dateStr: string;
	/** Callback invoked when the user confirms creation */
	private onConfirm: () => void;

	/**
	 * Creates a new ConfirmModal instance
	 * @param app - Obsidian app instance
	 * @param i18n - i18n object for translated strings
	 * @param dateStr - Date string to display in the message
	 * @param onConfirm - Callback to invoke on confirmation
	 */
	constructor(
		app: App,
		i18n: I18nLike,
		dateStr: string,
		onConfirm: () => void
	) {
		super(app);
		this.i18n = i18n;
		this.dateStr = dateStr;
		this.onConfirm = onConfirm;
	}

	/**
	 * Builds the modal content when opened.
	 * Renders the title, message with date placeholder, and action buttons.
	 */
	onOpen(): void {
		const { contentEl } = this;
		const t = this.i18n.modal as Record<string, string>;

		contentEl.createEl("h3", { text: t.confirmTitle ?? "Confirm" });
		contentEl.createEl("p", { text: (t.confirmMessage ?? "Create note for {{date}}?").replace(/\{\{date\}\}/g, this.dateStr) });

		const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

		new ButtonComponent(buttonContainer)
			.setButtonText(t.cancelButton ?? "Cancel")
			.onClick(() => this.close());

		new ButtonComponent(buttonContainer)
			.setButtonText(t.createButton ?? "Create")
			.setCta()
			.onClick(() => {
				this.close();
				this.onConfirm();
			});
	}

	/**
	 * Cleans up modal content when closed.
	 */
	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
