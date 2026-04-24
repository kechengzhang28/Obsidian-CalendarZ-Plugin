import {App, Modal, Setting} from "obsidian";
import type {PluginLike} from "../types";

/**
 * Modal for managing ignored folders.
 * Allows users to add and remove folder paths from the ignore list.
 */
export class IgnoredFoldersModal extends Modal {
	/** Current list of ignored folders */
	ignoredFolders: string[];
	/** Plugin instance for accessing current i18n */
	private plugin: PluginLike;
	/** Callback when folders are updated */
	onUpdate: (folders: string[]) => Promise<void>;

	/**
	 * Creates a new ignored folders modal.
	 * @param app - Obsidian App instance
	 * @param ignoredFolders - Current list of ignored folders
	 * @param plugin - Plugin instance for accessing i18n
	 * @param onUpdate - Callback function when folders are updated
	 */
	constructor(
		app: App,
		ignoredFolders: string[],
		plugin: PluginLike,
		onUpdate: (folders: string[]) => Promise<void>
	) {
		super(app);
		this.ignoredFolders = [...ignoredFolders];
		this.plugin = plugin;
		this.onUpdate = onUpdate;
	}

	/**
	 * Called when the modal is opened.
	 * Renders the modal content.
	 */
	onOpen(): void {
		const {contentEl} = this;
		const t = this.plugin.i18n.settings.ignoredFolders;

		contentEl.empty();
		this.titleEl.setText(t.modalTitle);

		// Add new folder section
		const addSection = contentEl.createDiv({cls: "calendarz-modal-add-section"});

		let folderInput: HTMLInputElement;

		new Setting(addSection)
			.setName(t.addNewFolder)
			.addText(text => {
				text.setPlaceholder(t.placeholder);
				folderInput = text.inputEl;
			})
			.addButton(button => {
				button.setButtonText(t.addButton);
				button.setCta();
				button.onClick(() => {
					const folderPath = folderInput.value.trim();
					if (folderPath && !this.ignoredFolders.includes(folderPath)) {
						this.ignoredFolders.push(folderPath);
						folderInput.value = "";
						this.renderFolderList();
					}
				});
			});

		// Folder list section
		const listSection = contentEl.createDiv({cls: "calendarz-modal-list-section"});

		this.folderListContainer = listSection.createDiv({cls: "calendarz-modal-folder-list"});
		this.renderFolderList();

		// Footer buttons
		const footer = contentEl.createDiv({cls: "calendarz-modal-footer"});

		new Setting(footer)
			.addButton(button => {
				button.setButtonText(t.saveButton);
				button.setCta();
				button.onClick(async () => {
					await this.onUpdate(this.ignoredFolders);
					this.close();
				});
			})
			.addButton(button => {
				button.setButtonText(t.cancelButton);
				button.onClick(() => {
					this.close();
				});
			});
	}

	/** Container element for the folder list */
	private folderListContainer: HTMLElement;

	/**
	 * Renders the list of ignored folders.
	 */
	private renderFolderList(): void {
		this.folderListContainer.empty();
		const t = this.plugin.i18n.settings.ignoredFolders;

		if (this.ignoredFolders.length === 0) {
			this.folderListContainer.createEl("div", {
				text: t.empty,
				cls: "calendarz-modal-empty"
			});
			return;
		}

		const list = this.folderListContainer.createEl("ul", {
			cls: "calendarz-modal-folder-items"
		});

		for (const folder of this.ignoredFolders) {
			const item = list.createEl("li", {
				cls: "calendarz-modal-folder-item"
			});

			item.createSpan({
				text: folder,
				cls: "calendarz-modal-folder-path"
			});

			const removeBtn = item.createEl("button", {
				cls: "calendarz-modal-remove-btn"
			});
			removeBtn.textContent = "✕";
			removeBtn.setAttribute("aria-label", t.removeButton);
			removeBtn.addEventListener("click", () => {
				this.ignoredFolders = this.ignoredFolders.filter(f => f !== folder);
				this.renderFolderList();
			});
		}
	}

	/**
	 * Called when the modal is closed.
	 * Cleans up the modal content.
	 */
	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}
