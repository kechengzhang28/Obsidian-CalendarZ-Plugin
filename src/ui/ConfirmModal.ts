import {App, Modal, ButtonComponent} from "obsidian";
import {I18n, interpolate} from "../i18n";

/**
 * Modal dialog for confirming daily note creation.
 */
export class ConfirmModal extends Modal {
	private dateStr: string;
	private i18n: I18n;
	onConfirm: () => void;
	onCancel: () => void;

	constructor(app: App, i18n: I18n, dateStr: string, onConfirm: () => void, onCancel: () => void) {
		super(app);
		this.i18n = i18n;
		this.dateStr = dateStr;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
	}

	onOpen(): void {
		const {contentEl} = this;
		const t = this.i18n.modal;

		contentEl.empty();

		contentEl.createEl("h3", {text: t.confirmTitle});
		contentEl.createEl("p", {text: interpolate(t.confirmMessage, {date: this.dateStr})});

		const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});

		new ButtonComponent(buttonContainer)
			.setButtonText(t.cancelButton)
			.onClick(() => {
				this.close();
				this.onCancel();
			});

		new ButtonComponent(buttonContainer)
			.setButtonText(t.createButton)
			.setCta()
			.onClick(() => {
				this.close();
				this.onConfirm();
			});
	}

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}
