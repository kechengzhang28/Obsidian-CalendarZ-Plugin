import {App, Modal, ButtonComponent} from "obsidian";
import type {I18n} from "../i18n";

/**
 * Modal dialog for confirming daily note creation.
 * Displays a confirmation message before creating a new daily note.
 */
export class ConfirmModal extends Modal {
	/** Internationalization strings */
	private i18n: I18n;
	/** Date string to display in the confirmation message */
	private dateStr: string;
	/** Callback function when user confirms */
	private onConfirm: () => void;

	/**
	 * Creates a new confirmation modal.
	 * @param app - Obsidian App instance
	 * @param i18n - Internationalization strings
	 * @param dateStr - Date string to display
	 * @param onConfirm - Callback when user confirms
	 */
	constructor(
		app: App,
		i18n: I18n,
		dateStr: string,
		onConfirm: () => void
	) {
		super(app);
		this.i18n = i18n;
		this.dateStr = dateStr;
		this.onConfirm = onConfirm;
	}

	/**
	 * Called when the modal is opened.
	 * Renders the modal content with title, message, and buttons.
	 */
	onOpen(): void {
		const {contentEl} = this;
		const t = this.i18n.modal;

		contentEl.createEl("h3", {text: t.confirmTitle});
		contentEl.createEl("p", {text: t.confirmMessage.replace(/\{\{date\}\}/g, this.dateStr)});

		const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});

		new ButtonComponent(buttonContainer)
			.setButtonText(t.cancelButton)
			.onClick(() => this.close());

		new ButtonComponent(buttonContainer)
			.setButtonText(t.createButton)
			.setCta()
			.onClick(() => {
				this.close();
				this.onConfirm();
			});
	}

	/**
	 * Called when the modal is closed.
	 * Cleans up the modal content.
	 */
	onClose(): void {
		this.contentEl.empty();
	}
}
