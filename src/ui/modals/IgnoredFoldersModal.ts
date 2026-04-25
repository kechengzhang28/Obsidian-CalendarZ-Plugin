import { App, Modal, Setting } from "obsidian";
import type { I18nLike } from "../../core/types";

export class IgnoredFoldersModal extends Modal {
	ignoredFolders: string[];
	private i18n: I18nLike;
	private onUpdate: (folders: string[]) => Promise<void>;
	private folderListEl: HTMLElement | null = null;

	constructor(
		app: App,
		ignoredFolders: string[],
		i18n: I18nLike,
		onUpdate: (folders: string[]) => Promise<void>
	) {
		super(app);
		this.ignoredFolders = [...ignoredFolders];
		this.i18n = i18n;
		this.onUpdate = onUpdate;
	}

	onOpen(): void {
		const { contentEl } = this;
		const t = (this.i18n.settings as Record<string, Record<string, string>>).ignoredFolders!;

		contentEl.empty();
		this.titleEl.setText(t.modalTitle ?? "Ignored Folders");

		const addSection = contentEl.createDiv({ cls: "calendarz-modal-add-section" });

		let folderInput: HTMLInputElement;

		new Setting(addSection)
			.setName(t.addNewFolder ?? "Add folder")
			.addText(text => {
				folderInput = text.inputEl;
				text.setPlaceholder(t.placeholder ?? "folder/path");
			});

		new Setting(addSection)
			.addButton(button => {
				button
					.setButtonText(t.addButton ?? "Add")
					.setCta()
					.onClick(async () => {
						const value = folderInput.value.trim();
						if (value && !this.ignoredFolders.includes(value)) {
							this.ignoredFolders.push(value);
							folderInput.value = "";
							await this.renderFolderList();
						}
					});
			});

		contentEl.createEl("h4", { text: t.currentlyIgnored ?? "Current folders", cls: "calendarz-modal-section-title" });
		this.folderListEl = contentEl.createDiv({ cls: "calendarz-modal-folder-list" });
		void this.renderFolderList();

		new Setting(contentEl)
			.addButton(button => {
				button
					.setButtonText(t.saveButton ?? "Save")
					.setCta()
					.onClick(async () => {
						await this.onUpdate(this.ignoredFolders);
						this.close();
					});
			});
	}

	private async renderFolderList(): Promise<void> {
		if (!this.folderListEl) return;
		this.folderListEl.empty();

		const t = (this.i18n.settings as Record<string, Record<string, string>>).ignoredFolders!;

		if (this.ignoredFolders.length === 0) {
			this.folderListEl.createEl("p", {
				text: t.empty ?? "No folders ignored",
				cls: "calendarz-modal-empty"
			});
			return;
		}

		for (const folder of this.ignoredFolders) {
			const itemEl = this.folderListEl.createDiv({ cls: "calendarz-modal-folder-item" });
			itemEl.createSpan({ text: folder, cls: "calendarz-modal-folder-path" });

			const removeBtn = itemEl.createEl("button", {
				cls: "calendarz-modal-remove-btn",
				text: t.removeButton ?? "Remove"
			});
			removeBtn.addEventListener("click", () => {
			void (async () => {
				this.ignoredFolders = this.ignoredFolders.filter(f => f !== folder);
				await this.renderFolderList();
			})();
		});
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
