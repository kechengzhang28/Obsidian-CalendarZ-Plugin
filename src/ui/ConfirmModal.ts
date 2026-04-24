import {App, Modal, ButtonComponent} from "obsidian";
import type {PluginLike} from "../types";

/**
 * Modal dialog for confirming daily note creation.
 * Displays a confirmation message before creating a new daily note.
 */
export class ConfirmModal extends Modal {
	/** Plugin instance for accessing current i18n */
	private plugin: PluginLike;
	/** Date string to display in the confirmation message */
	private dateStr: string;
	/** Callback function when user confirms */
	private onConfirm: () => void;

	/**
	 * Creates a new confirmation modal.
	 * @param app - Obsidian App instance
	 * @param plugin - Plugin instance for accessing i18n
	 * @param dateStr - Date string to display
	 * @param onConfirm - Callback when user confirms
	 */
	constructor(
		app: App,
		plugin: PluginLike,
		dateStr: string,
		onConfirm: () => void
	) {
		super(app);
		this.plugin = plugin;
		this.dateStr = dateStr;
		this.onConfirm = onConfirm;
	}

	/**
	 * Called when the modal is opened.
	 * Renders the modal content with title, message, and buttons.
	 */
	onOpen(): void {
		const {contentEl} = this;
		const t = this.plugin.i18n.modal;

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
