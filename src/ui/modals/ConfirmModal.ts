import { App, Modal, ButtonComponent } from "obsidian";
import type { I18nLike } from "../../core/types";

export class ConfirmModal extends Modal {
	private i18n: I18nLike;
	private dateStr: string;
	private onConfirm: () => void;

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
			.setButtonText(t.confirmButton ?? "Create")
			.setCta()
			.onClick(() => {
				this.close();
				this.onConfirm();
			});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
