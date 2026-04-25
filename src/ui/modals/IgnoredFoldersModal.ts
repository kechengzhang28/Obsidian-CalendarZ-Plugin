import { App, Modal, Setting } from "obsidian";
import type { I18nLike } from "../../core/types";

/**
 * Modal for managing the list of ignored folders.
 * Allows users to add, remove, and save folders that should be excluded from note counting.
 */
export class IgnoredFoldersModal extends Modal {
	/** Current list of ignored folders (mutated during editing) */
	ignoredFolders: string[];
	/** i18n object for translated strings */
	private i18n: I18nLike;
	/** Callback invoked when the user saves changes */
	private onUpdate: (folders: string[]) => Promise<void>;
	/** Container element for the folder list */
	private folderListEl: HTMLElement | null = null;
	/** Track event listeners for cleanup to prevent memory leaks */
	private removeListeners: Array<() => void> = [];

	/**
	 * Creates a new IgnoredFoldersModal instance
	 * @param app - Obsidian app instance
	 * @param ignoredFolders - Initial list of ignored folders
	 * @param i18n - i18n object for translated strings
	 * @param onUpdate - Callback invoked when changes are saved
	 */
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

	/**
	 * Builds the modal content when opened.
	 * Renders the add-folder section, current folder list, and save button.
	 */
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
					.onClick(() => {
						const value = folderInput.value.trim();
						if (value && !this.ignoredFolders.includes(value)) {
							this.ignoredFolders.push(value);
							folderInput.value = "";
							this.renderFolderList();
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

	/**
	 * Renders the list of currently ignored folders.
	 * Each item shows the folder path and a remove button.
	 * Re-renders are triggered after add/remove operations.
	 */
	private renderFolderList(): void {
		if (!this.folderListEl) return;
		this.folderListEl.empty();
		// Clear previous listeners before re-rendering to prevent memory leaks
		this.clearRemoveListeners();

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

			const handleRemove = (): void => {
				this.ignoredFolders = this.ignoredFolders.filter(f => f !== folder);
				this.renderFolderList();
			};

			removeBtn.addEventListener("click", handleRemove);
			// Track listener for cleanup
			this.removeListeners.push(() => removeBtn.removeEventListener("click", handleRemove));
		}
	}

	/**
	 * Cleans up all tracked event listeners.
	 * Must be called before re-rendering or closing the modal.
	 */
	private clearRemoveListeners(): void {
		for (const cleanup of this.removeListeners) {
			cleanup();
		}
		this.removeListeners = [];
	}

	/**
	 * Cleans up resources when the modal is closed.
	 * Removes all event listeners and clears the content.
	 */
	onClose(): void {
		this.clearRemoveListeners();
		const { contentEl } = this;
		contentEl.empty();
	}
}
