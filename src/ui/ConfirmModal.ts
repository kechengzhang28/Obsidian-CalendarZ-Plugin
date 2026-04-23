import {App, Modal, ButtonComponent} from "obsidian";
import type {I18n} from "../i18n";

export class ConfirmModal extends Modal {
	constructor(
		app: App,
		private i18n: I18n,
		private dateStr: string,
		private onConfirm: () => void
	) {
		super(app);
	}

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

	onClose(): void {
		this.contentEl.empty();
	}
}
